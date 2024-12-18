import { v4 as uuidv4 } from 'uuid'
import { VisualizationSpec } from 'react-vega'
import { ArrowPathIcon, ClockIcon, StopIcon } from '@heroicons/react/20/solid'
import * as Y from 'yjs'
import {
  type VisualizationBlock,
  getVisualizationBlockExecStatus,
  BlockType,
  isVisualizationBlock,
  execStatusIsDisabled,
  getVisualizationAttributes,
  getDataframe,
} from '@briefer/editor'
import { ApiDocument } from '@briefer/database'
import { FunnelIcon } from '@heroicons/react/24/outline'
import { useCallback, useEffect, useMemo, useState } from 'react'
import HeaderSelect from '@/components/HeaderSelect'
import clsx from 'clsx'
import FilterSelector from './FilterSelector'
import {
  ChartType,
  DataFrame,
  DataFrameColumn,
  HistogramBin,
  HistogramFormat,
  TimeUnit,
  VisualizationFilter,
  isInvalidVisualizationFilter,
  NumpyDateTypes,
  YAxis,
} from '@briefer/types'
import VisualizationControls from './VisualizationControls'
import VisualizationView from './VisualizationView'
import { ConnectDragPreview } from 'react-dnd'
import { equals } from 'ramda'
import { useEnvironmentStatus } from '@/hooks/useEnvironmentStatus'
import { VisualizationExecTooltip } from '../../ExecTooltip'
import useFullScreenDocument from '@/hooks/useFullScreenDocument'
import HiddenInPublishedButton from '../../HiddenInPublishedButton'
import useEditorAwareness from '@/hooks/useEditorAwareness'
import { downloadFile } from '@/utils/file'

function didChangeFilters(oldFilters: VisualizationFilter[], newFilters: VisualizationFilter[]) {
  const toCompare = new Set(newFilters.map((f) => f.id))

  if (oldFilters.length !== newFilters.length) {
    return true
  }

  const didChange = oldFilters.some((of) => {
    const nf = newFilters.find((f) => f.id === of.id)
    if (!nf) {
      return true
    }

    toCompare.delete(of.id)

    return (
      !equals(of.value, nf.value) ||
      of.operator !== nf.operator ||
      of.column?.name !== nf.column?.name
    )
  })

  return didChange || toCompare.size > 0
}

interface Props {
  document: ApiDocument
  dataframes: Y.Map<DataFrame>
  block: Y.XmlElement<VisualizationBlock>
  dragPreview: ConnectDragPreview | null
  isEditable: boolean
  isPublicMode: boolean
  onAddGroupedBlock: (blockId: string, blockType: BlockType, position: 'before' | 'after') => void
  onRun: (block: Y.XmlElement<VisualizationBlock>) => void
  isDashboard: boolean
  renderer?: 'canvas' | 'svg'
  hasMultipleTabs: boolean
  isBlockHiddenInPublished: boolean
  onToggleIsBlockHiddenInPublished: (blockId: string) => void
  isCursorWithin: boolean
  isCursorInserting: boolean
}
function VisualizationBlock(props: Props) {
  const dataframe = getDataframe(props.block, props.dataframes)

  const onChangeDataframe = useCallback(
    (dfName: string) => {
      const df = props.dataframes.get(dfName)
      if (df) {
        props.block.setAttribute('dataframeName', dfName)
      }
    },
    [props.block, props.dataframes]
  )

  const dataframeOptions = Array.from(props.dataframes.values()).map((df) => ({
    value: df.name,
    label: df.name,
  }))

  const {
    id: blockId,
    title,
    xAxis,
    xAxisName,
    status,
    filters,
    controlsHidden,
    chartType,
    xAxisGroupFunction,
    xAxisSort,
    yAxes,
    histogramFormat,
    histogramBin,
    numberValuesFormat,
    showDataLabels,
    error,
    spec: blockSpec,
  } = getVisualizationAttributes(props.block)

  const onNewSQL = useCallback(() => {
    if (blockId) {
      props.onAddGroupedBlock(blockId, BlockType.SQL, 'before')
    }
  }, [blockId, props.onAddGroupedBlock])

  const onChangeXAxis = useCallback(
    (xAxis: DataFrameColumn | null) => {
      if (xAxis) {
        props.block.setAttribute('xAxis', xAxis)
        const isDateTime = NumpyDateTypes.safeParse(xAxis.type).success
        if (isDateTime && !props.block.getAttribute('xAxisGroupFunction')) {
          props.block.setAttribute('xAxisGroupFunction', 'date')
        }
      } else {
        props.block.removeAttribute('xAxis')
      }
    },
    [props.block]
  )

  const onChangeXAxisName = useCallback(
    (name: string | null) => {
      props.block.setAttribute('xAxisName', name)
    },
    [props.block]
  )

  const isEditable =
    props.isEditable && status !== 'run-all-enqueued' && status !== 'run-all-running'
  const execStatus = getVisualizationBlockExecStatus(props.block)
  const onRunAbort = useCallback(() => {
    if (status === 'running') {
      props.block.setAttribute('status', 'abort-requested')
    } else {
      props.onRun(props.block)
    }
  }, [props.block, props.onRun, status])

  const onAddFilter = useCallback(() => {
    const newFilter: VisualizationFilter = {
      id: uuidv4(),
      type: 'unfinished-visualization-filter',
      column: null,
      operator: null,
      value: null,
    }
    props.block.setAttribute('filters', [...filters, newFilter])
  }, [filters, props.block])

  const onChangeFilter = useCallback(
    (filter: VisualizationFilter) => {
      props.block.setAttribute(
        'filters',
        filters.map((f) => (f.id === filter.id ? filter : f))
      )
    },
    [filters, props.block]
  )

  const onRemoveFilter = useCallback(
    (filter: VisualizationFilter) => {
      props.block.setAttribute(
        'filters',
        filters.filter((f) => f.id !== filter.id)
      )
    },
    [filters, props.block]
  )

  const onToggleHidden = useCallback(() => {
    props.block.setAttribute('controlsHidden', !controlsHidden)
  }, [controlsHidden, props.block])

  const onExportToPNG = async () => {
    // we don't need to check if props.renderer is undefined because the application sets as 'canvas' in this case
    if (props.renderer === 'svg' || chartType === 'number' || chartType === 'trend') return

    // if the controls are visible the canvas shrinks, making the export smaller
    if (!controlsHidden) {
      onToggleHidden()
      // tick to ensure the canvas size gets updated
      await new Promise((r) => setTimeout(r, 0))
    }

    const canvas = document.querySelector(
      `div[data-block-id='${blockId}'] canvas`
    ) as HTMLCanvasElement

    // TODO: identify when this is true
    if (!canvas) return

    const imageUrl = canvas.toDataURL('image/png')
    const fileName = title || 'Visualization'
    downloadFile(imageUrl, fileName)
  }

  const onChangeChartType = useCallback(
    (chartType: ChartType) => {
      props.block.setAttribute('chartType', chartType)
    },
    [props.block]
  )

  const onChangeXAxisGroupFunction = useCallback(
    (groupFunction: TimeUnit | null) => {
      if (groupFunction) {
        props.block.setAttribute('xAxisGroupFunction', groupFunction)
      } else {
        props.block.removeAttribute('xAxisGroupFunction')
      }
    },
    [props.block]
  )

  const onChangeXAxisSort = useCallback(
    (sort: 'ascending' | 'descending') => {
      props.block.setAttribute('xAxisSort', sort)
    },
    [props.block]
  )

  const onChangeHistogramFormat = useCallback(
    (format: HistogramFormat) => {
      props.block.setAttribute('histogramFormat', format)
    },
    [props.block]
  )

  const onChangeHistogramBin = useCallback(
    (bin: HistogramBin) => {
      props.block.setAttribute('histogramBin', bin)
    },
    [props.block]
  )

  const onChangeNumberValuesFormat = useCallback(
    (name: string | null) => {
      props.block.setAttribute('numberValuesFormat', name)
    },
    [props.block]
  )

  const tooManyDataPointsHidden = props.block.getAttribute('tooManyDataPointsHidden') ?? true
  const onHideTooManyDataPointsWarning = useCallback(() => {
    props.block.setAttribute('tooManyDataPointsHidden', true)
  }, [props.block])

  const spec = useMemo(() => {
    if (!blockSpec) {
      return null
    }

    const blockSpecConfig =
      typeof blockSpec.config === 'object'
        ? {
            legend: { orient: window.innerWidth < 768 ? 'bottom' : 'right' },

            ...blockSpec.config,
          }
        : blockSpec.config

    return {
      ...blockSpec,
      width: 'container',
      autosize: { type: 'fit', contains: 'padding' },
      padding: { left: 16, right: 16, top: 12, bottom: 12 },
      config: blockSpecConfig,
    } as VisualizationSpec
  }, [blockSpec])

  const onChangeTitle = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      props.block.setAttribute('title', e.target.value)
    },
    [props.block]
  )

  const [isDirty, setIsDirty] = useState(false)
  useEffect(() => {
    if (!dataframe) {
      return
    }

    let timeout: NodeJS.Timeout | null = null
    function observe(event: Y.YXmlEvent) {
      const block = event.target
      if (!(block instanceof Y.XmlElement)) {
        return
      }

      if (!isVisualizationBlock(block)) {
        return
      }

      if (!dataframe) {
        return
      }

      const shouldIgnore =
        event.changes.keys.size === 0 ||
        Array.from(event.changes.keys.entries()).every(
          ([key, val]) =>
            key === 'title' ||
            key === 'status' ||
            key === 'spec' ||
            key === 'controlsHidden' ||
            key === 'tooManyDataPointsHidden' ||
            key === 'error' ||
            key === 'updatedAt' ||
            (key === 'filters' &&
              !didChangeFilters(val.oldValue ?? [], block.getAttribute('filters') ?? []))
        )

      if (!shouldIgnore) {
        if (timeout) {
          clearTimeout(timeout)
        }

        timeout = setTimeout(() => {
          setIsDirty(true)
        }, 1000)
      }
    }
    props.block.observe(observe)

    return () => {
      if (timeout) {
        clearTimeout(timeout)
      }

      props.block.unobserve(observe)
    }
  }, [props.block, dataframe])

  useEffect(() => {
    if (isDirty) {
      props.onRun(props.block)
      setIsDirty(false)
    }
  }, [isDirty, props.block, props.onRun])

  const { status: envStatus, loading: envLoading } = useEnvironmentStatus(
    props.document.workspaceId
  )

  const [isFullscreen] = useFullScreenDocument(props.document.id)

  const onChangeYAxes = useCallback(
    (yAxes: YAxis[]) => {
      props.block.setAttribute('yAxes', yAxes)
    },
    [props.block]
  )

  const hasAValidYAxis = yAxes.some((yAxis) => yAxis.series.some((s) => s.column !== null))

  const onChangeShowDataLabels = useCallback(
    (showDataLabels: boolean) => {
      props.block.setAttribute('showDataLabels', showDataLabels)
    },
    [props.block]
  )

  useEffect(() => {
    if (status === 'running' || status === 'run-requested') {
      // 30 seconds timeout
      const timeout = setTimeout(() => {
        const status = props.block.getAttribute('status')
        if (status === 'running') {
          props.block.setAttribute('status', 'run-requested')
        } else if (status === 'run-requested') {
          props.block.setAttribute('status', 'idle')
          requestAnimationFrame(() => {
            props.block.setAttribute('status', 'run-requested')
          })
        }
      }, 1000 * 30)

      return () => {
        clearTimeout(timeout)
      }
    }
  }, [props.block, status])

  const onToggleIsBlockHiddenInPublished = useCallback(() => {
    props.onToggleIsBlockHiddenInPublished(blockId)
  }, [props.onToggleIsBlockHiddenInPublished, blockId])

  const [, editorAPI] = useEditorAwareness()
  const onClickWithin = useCallback(() => {
    editorAPI.insert(blockId, { scrollIntoView: false })
  }, [blockId, editorAPI.insert])

  if (props.isDashboard) {
    return (
      <VisualizationView
        title={title}
        chartType={chartType}
        spec={spec}
        tooManyDataPointsHidden={tooManyDataPointsHidden}
        onHideTooManyDataPointsWarning={onHideTooManyDataPointsWarning}
        loading={execStatus === 'loading'}
        error={error}
        dataframe={dataframe}
        onNewSQL={onNewSQL}
        controlsHidden={controlsHidden}
        isFullscreen={isFullscreen}
        renderer={props.renderer}
        isHidden={controlsHidden}
        onToggleHidden={onToggleHidden}
        onExportToPNG={onExportToPNG}
        isDashboard={props.isDashboard}
        isEditable={isEditable}
      />
    )
  }

  return (
    <div
      onClick={onClickWithin}
      className={clsx(
        'group/block printable-block relative h-full rounded-md border bg-white',
        props.isBlockHiddenInPublished && 'border-dashed',
        props.hasMultipleTabs ? 'rounded-tl-none' : 'rounded-tl-md',
        props.isCursorWithin ? 'border-blue-400 shadow-sm' : 'border-gray-200'
      )}
      data-block-id={blockId}>
      <div className="h-full">
        <div className="py-3">
          <div
            className="flex h-[1.6rem] items-center justify-between gap-x-2 px-3 pr-3 font-sans"
            ref={(d) => {
              props.dragPreview?.(d)
            }}>
            <div className="flex h-full w-full gap-x-4">
              <input
                type="text"
                disabled={!isEditable}
                className={clsx(
                  'block h-full w-full rounded-md border-0 bg-transparent py-0 pl-1 font-sans text-xs text-gray-500 ring-inset ring-gray-200 placeholder:text-gray-400 hover:ring-1 focus:ring-1 focus:ring-inset focus:ring-gray-400 disabled:ring-0'
                )}
                placeholder="Visualization"
                value={title}
                onChange={onChangeTitle}
              />
              <div className="flex min-h-3 gap-x-2 text-xs print:hidden">
                <button
                  className={clsx(
                    'flex h-6 items-center gap-x-1.5 whitespace-nowrap rounded-md border border-gray-200 px-3 font-sans text-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-white',
                    props.isPublicMode ? 'hidden' : 'inline-block'
                  )}
                  onClick={onAddFilter}
                  disabled={!isEditable}>
                  <FunnelIcon className="h-3 w-3" />
                  <span>Add filter</span>
                </button>
                <HeaderSelect
                  value={dataframe?.name ?? ''}
                  onChange={onChangeDataframe}
                  options={dataframeOptions}
                  onAdd={onNewSQL}
                  onAddLabel="New query"
                  disabled={!isEditable}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className={clsx(
            'min-h[3rem] flex flex-wrap items-center gap-2 border-t border-gray-200 p-2',
            {
              hidden: filters.length === 0,
            }
          )}>
          {filters.map((filter) => (
            <FilterSelector
              key={filter.id}
              filter={filter}
              dataframe={dataframe ?? { name: '', columns: [] }}
              onChange={onChangeFilter}
              onRemove={onRemoveFilter}
              isInvalid={
                !dataframe ||
                (filter.column !== null &&
                  (!dataframe.columns.some((c) => c.name === filter.column?.name) ||
                    isInvalidVisualizationFilter(filter, dataframe)))
              }
              disabled={!isEditable}
            />
          ))}
        </div>
        <div className="flex h-[496px] items-center border-t border-gray-200">
          <VisualizationControls
            isHidden={controlsHidden || !props.isEditable}
            dataframe={dataframe}
            chartType={chartType}
            onChangeChartType={onChangeChartType}
            xAxis={xAxis}
            onChangeXAxis={onChangeXAxis}
            xAxisName={xAxisName}
            onChangeXAxisName={onChangeXAxisName}
            xAxisSort={xAxisSort}
            onChangeXAxisSort={onChangeXAxisSort}
            xAxisGroupFunction={xAxisGroupFunction}
            onChangeXAxisGroupFunction={onChangeXAxisGroupFunction}
            yAxes={yAxes}
            onChangeYAxes={onChangeYAxes}
            histogramFormat={histogramFormat}
            onChangeHistogramFormat={onChangeHistogramFormat}
            histogramBin={histogramBin}
            onChangeHistogramBin={onChangeHistogramBin}
            numberValuesFormat={numberValuesFormat}
            onChangeNumberValuesFormat={onChangeNumberValuesFormat}
            showDataLabels={showDataLabels}
            onChangeShowDataLabels={onChangeShowDataLabels}
            isEditable={isEditable}
          />
          <VisualizationView
            title={title}
            chartType={chartType}
            spec={spec}
            tooManyDataPointsHidden={tooManyDataPointsHidden}
            onHideTooManyDataPointsWarning={onHideTooManyDataPointsWarning}
            loading={execStatus === 'loading'}
            error={error}
            dataframe={dataframe}
            onNewSQL={onNewSQL}
            controlsHidden={controlsHidden}
            isFullscreen={isFullscreen}
            renderer={props.renderer}
            isHidden={controlsHidden}
            onToggleHidden={onToggleHidden}
            onExportToPNG={onExportToPNG}
            isDashboard={props.isDashboard}
            isEditable={isEditable}
          />
        </div>
      </div>

      <div
        className={clsx(
          'absolute right-0 top-0 flex translate-x-full flex-col gap-y-1 pl-1.5 opacity-0 transition-opacity group-hover/block:opacity-100',
          execStatusIsDisabled(execStatus) ? 'opacity-100' : 'opacity-0',
          {
            hidden: !props.isEditable,
          }
        )}>
        <button
          className={clsx(
            {
              'cursor-not-allowed bg-gray-200': status !== 'idle' && status !== 'running',
              'bg-red-200': status === 'running' && envStatus === 'Running',
              'bg-yellow-300': status === 'running' && envStatus !== 'Running',
              'bg-primary-200': status === 'idle',
            },
            'group relative flex h-6 min-w-6 items-center justify-center rounded-sm'
          )}
          onClick={onRunAbort}
          disabled={
            !dataframe ||
            (!xAxis && chartType !== 'number' && chartType !== 'trend') ||
            (!hasAValidYAxis && chartType !== 'histogram') ||
            !isEditable ||
            (status !== 'idle' && status !== 'running')
          }>
          {status !== 'idle' ? (
            <div>
              {execStatus === 'enqueued' ? (
                <ClockIcon className="h-3 w-3 text-gray-500" />
              ) : (
                <StopIcon className="h-3 w-3 text-gray-500" />
              )}
              <VisualizationExecTooltip
                envStatus={envStatus}
                envLoading={envLoading}
                execStatus={execStatus}
                status={status}
              />
            </div>
          ) : (
            <RunVisualizationTooltip />
          )}
        </button>
        <HiddenInPublishedButton
          isBlockHiddenInPublished={props.isBlockHiddenInPublished}
          onToggleIsBlockHiddenInPublished={onToggleIsBlockHiddenInPublished}
          hasMultipleTabs={props.hasMultipleTabs}
        />
      </div>
    </div>
  )
}

function RunVisualizationTooltip() {
  return (
    <div>
      <ArrowPathIcon className="h-3 w-3 text-white" />
      <div className="bg-hunter-950 pointer-events-none absolute -top-1 left-1/2 flex w-max -translate-x-1/2 -translate-y-full flex-col gap-y-1 rounded-md p-2 font-sans text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
        <span>刷新</span>
      </div>
    </div>
  )
}

export default VisualizationBlock
