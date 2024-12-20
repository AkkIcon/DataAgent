import { EyeIcon } from '@heroicons/react/24/outline'
import { Tooltip } from './Tooltips'

interface Props {
  onClick: () => void
  disabled: boolean
  tooltipActive: boolean
}
function LiveButton(props: Props) {
  return (
    <Tooltip
      tooltipClassname="w-40"
      title="Page never published"
      message="Publish this page to see a live version."
      position="bottom"
      active={props.tooltipActive}>
      <button
        className="transition-mw group flex max-w-[42px] items-center overflow-hidden rounded-sm border border-gray-200 bg-white px-3 py-1 text-sm text-gray-500 duration-500 hover:max-w-[120px] hover:bg-gray-100 disabled:cursor-not-allowed disabled:bg-gray-100 xl:max-w-[120px]"
        onClick={props.onClick}
        disabled={props.disabled}>
        <EyeIcon className="min-h-4 min-w-4" />

        <span className="ml-2 text-clip text-nowrap opacity-0 transition-opacity duration-500 group-hover:opacity-100 xl:opacity-100">
          Live version
        </span>
      </button>
    </Tooltip>
  )
}

export default LiveButton
