import { useEnvironmentStatus } from '@/hooks/useEnvironmentStatus'
import { useStringQuery } from '@/hooks/useQueryArgs'
import type { EnvironmentStatus } from '@briefer/database'
import {
  ArrowPathIcon,
  CodeBracketIcon,
  CpuChipIcon,
  FolderIcon,
  // NewspaperIcon,
} from '@heroicons/react/20/solid'
import { NewspaperIcon } from '@heroicons/react/24/solid'
import Link from 'next/link'
import * as dfns from 'date-fns'
import clsx from 'clsx'

interface Props {
  onOpenFiles: () => void
  publishedAt: string | null
  lastUpdatedAt: string | null
}
function EnvBar(props: Props) {
  const workspaceId = useStringQuery('workspaceId')
  const { status, loading, restart } = useEnvironmentStatus(workspaceId)

  // distance from now
  const publishedAtDisplay = dfns.formatDistanceToNow(props.publishedAt ?? new Date())
    
  const lastUpdatedAt = props.lastUpdatedAt
    ? `最后执行的时间 ${dfns.format(props.lastUpdatedAt ?? new Date(), `HH:mm, yyyy-MM-dd`)}`
    : ''

  return (
    <div
      style={{ borderColor: 'rgba(0, 0, 0, 0.06)', backgroundColor: '#FAFAFA' }}
      className={clsx(
        'font-primary flex items-center justify-between border-t px-4 py-2',
        props.publishedAt && 'bg-gray-50'
      )}>
      <div className="flex items-center space-x-2">
        {props.publishedAt ? (
          <div className="flex items-center gap-x-1.5 text-sm font-medium text-gray-500">
            <NewspaperIcon className="h-4 w-4" />
            <span>{`Published ${publishedAtDisplay} ago. ${lastUpdatedAt}`}</span>
          </div>
        ) : (
          <>
            <div>
              <EnvironmentButton name="Python 3.9" workspaceId={workspaceId} />
            </div>
            <div>
              <Link
                href={`/workspaces/${workspaceId}/environments/current/variables`}
                className="flex cursor-pointer items-center gap-x-2 rounded-sm border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50">
                <CodeBracketIcon className="h-4 w-4 text-gray-600" />
                <span className="text-gray-700">Environment variables</span>
              </Link>
            </div>
            <button
              className="flex cursor-pointer items-center gap-x-2 rounded-sm border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50"
              onClick={props.onOpenFiles}>
              <FolderIcon className="h-4 w-4 text-gray-600" />
              <span className="text-gray-700">Files</span>
            </button>
            <div>{`${lastUpdatedAt}`}</div>
          </>
        )}
      </div>
      <div className="flex items-center">
        <StatusBadge loading={loading} status={status} onRestart={restart} />
      </div>
    </div>
  )
}

const EnvironmentButton = ({ name, workspaceId }: { name: string; workspaceId: string }) => {
  return (
    <div
      // href={`/workspaces/${workspaceId}/environments/current`}
      className="flex items-center gap-x-2 rounded-sm border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50">
      <CpuChipIcon className="h-4 w-4 text-gray-600" />
      <span className="text-gray-700">{name}</span>
    </div>
  )
}

const StatusBadge = ({
  loading,
  status,
  onRestart,
}: {
  loading: boolean
  status: EnvironmentStatus | null
  onRestart: () => void
}) => {
  if (loading) {
    return <LoadingBadge>Loading</LoadingBadge>
  }

  switch (status) {
    case 'Starting':
      return <YellowBadge>Starting</YellowBadge>
    case 'Running':
      return (
        <GreenBadge>
          <div className="flex items-center gap-x-2">
            <div>Running</div>
            <div className="h-4 w-[1px] bg-green-700 opacity-50" />
            <div className="group relative flex items-center">
              <button onClick={onRestart} className="text-green-700 hover:text-green-900">
                <ArrowPathIcon className="h-3 w-3" />
              </button>
              <div className="bg-hunter-950 pointer-events-none absolute -top-2 right-0 flex w-max -translate-y-full items-center justify-center gap-y-1 rounded-md p-2 font-sans text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                Restart environment
              </div>
            </div>
          </div>
        </GreenBadge>
      )
    case 'Stopped':
      return <GrayBadge>Stopped</GrayBadge>
    case 'Stopping':
      return <YellowBadge>Stopping</YellowBadge>
    case 'Failing':
      return <RedBadge>Failing</RedBadge>
  }

  return <GrayBadge>Stopped</GrayBadge>
}

type BadgeProps = {
  children: React.ReactNode
}

const LoadingBadge = ({ children }: BadgeProps) => {
  return (
    <span className="inline-flex items-center gap-x-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
      <svg className={`h-1.5 w-1.5 fill-blue-500`} viewBox="0 0 6 6" aria-hidden="true">
        {' '}
        <circle cx={3} cy={3} r={3} />{' '}
      </svg>
      <span className="text-xs">{children}</span>
    </span>
  )
}

const RedBadge = ({ children }: BadgeProps) => {
  return (
    <span className="inline-flex items-center gap-x-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700">
      <svg className={`h-1.5 w-1.5 fill-red-500`} viewBox="0 0 6 6" aria-hidden="true">
        {' '}
        <circle cx={3} cy={3} r={3} />{' '}
      </svg>
      <span className="text-xs">{children}</span>
    </span>
  )
}

const GrayBadge = ({ children }: BadgeProps) => {
  return (
    <span className="inline-flex items-center gap-x-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      <svg className={`h-1.5 w-1.5 fill-gray-400`} viewBox="0 0 6 6" aria-hidden="true">
        <circle cx={3} cy={3} r={3} />
      </svg>
      <span className="text-xs">{children}</span>
    </span>
  )
}

const GreenBadge = ({ children }: BadgeProps) => {
  return (
    <span className="inline-flex items-center gap-x-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
      <svg className={`h-1.5 w-1.5 fill-green-500`} viewBox="0 0 6 6" aria-hidden="true">
        <circle cx={3} cy={3} r={3} />
      </svg>
      <span className="text-xs">{children}</span>
    </span>
  )
}

const YellowBadge = ({ children }: BadgeProps) => {
  return (
    <span className="inline-flex items-center gap-x-1.5 rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800">
      <svg className={`h-1.5 w-1.5 fill-yellow-500`} viewBox="0 0 6 6" aria-hidden="true">
        <circle cx={3} cy={3} r={3} />
      </svg>
      <span className="text-xs">{children}</span>
    </span>
  )
}

export default EnvBar
