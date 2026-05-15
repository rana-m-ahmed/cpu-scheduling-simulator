/**
 * Sticky application header with brand and global status.
 */
import { Cpu, Menu } from 'lucide-react'
import { useSimulator } from '../../hooks/useSimulator.js'
import StatusDot from './StatusDot.jsx'

/**
 * Render the top app header.
 *
 * @param {{onToggleSidebar:function}} props - Header props.
 * @returns {JSX.Element} Header UI.
 */
export function Header({ onToggleSidebar }) {
  const { status } = useSimulator()

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-surface-1 text-text-muted transition hover:border-accent-cyan hover:text-accent-cyan lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-1 text-accent-cyan shadow-[0_0_18px_rgba(34,211,238,0.08)]">
              <Cpu className="h-4 w-4" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-text-primary">Scheduler</p>
              <p className="text-xs text-text-muted">OS CPU Scheduler</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-full border border-border bg-surface-1 px-3 py-1.5">
            <StatusDot status={status} />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header