/**
 * Shared status indicator used across the simulator shell.
 */
import { cn } from '../../utils/cn.js'

function getStatusMeta(status) {
  switch (status) {
    case 'running':
      return {
        dotClass: 'bg-accent-green animate-pulse',
        textClass: 'text-accent-green',
      }
    case 'paused':
      return {
        dotClass: 'bg-accent-amber',
        textClass: 'text-accent-amber',
      }
    case 'completed':
      return {
        dotClass: 'bg-accent-cyan',
        textClass: 'text-accent-cyan',
      }
    default:
      return {
        dotClass: 'bg-text-faint',
        textClass: 'text-text-faint',
      }
  }
}

/**
 * Render the current simulator status as a dot and label.
 *
 * @param {{status:string,className?:string,showText?:boolean}} props - Status indicator props.
 * @returns {JSX.Element} Status indicator UI.
 */
export function StatusDot({ status, className = '', showText = true }) {
  const statusMeta = getStatusMeta(status)

  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <span className={cn('h-2.5 w-2.5 rounded-full', statusMeta.dotClass)} aria-hidden="true" />
      {showText ? (
        <span className={cn('font-mono text-xs uppercase tracking-wider', statusMeta.textClass)}>
          {String(status).toUpperCase()}
        </span>
      ) : null}
    </span>
  )
}

export default StatusDot