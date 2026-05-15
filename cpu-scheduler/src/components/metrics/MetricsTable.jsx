/**
 * Sortable per-process metrics table.
 */
import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { useMetrics } from '../../hooks/useMetrics.js'
import { cn } from '../../utils/cn.js'

const SORT_OPTIONS = {
  arrivalTime: 'Arrival',
  burstTime: 'Burst',
  completionTime: 'Completion',
  turnaroundTime: 'Turnaround',
  waitingTime: 'Waiting',
  responseTime: 'Response',
}

function formatValue(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(2) : '0.00'
}

function SortIcon({ active, direction }) {
  if (!active) {
    return <ChevronsUpDown className="h-3.5 w-3.5" />
  }

  return direction === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
}

/**
 * Render the sortable metrics table.
 *
 * @returns {JSX.Element} Metrics table UI.
 */
export function MetricsTable() {
  const metrics = useMetrics()
  const [sortKey, setSortKey] = useState('pid')
  const [sortDir, setSortDir] = useState('asc')

  const sortedRows = useMemo(() => {
    const rows = [...(metrics?.perProcessRows ?? [])]

    rows.sort((left, right) => {
      const leftValue = left[sortKey]
      const rightValue = right[sortKey]

      if (leftValue === rightValue) {
        return left.pid - right.pid
      }

      if (typeof leftValue === 'string' || typeof rightValue === 'string') {
        return sortDir === 'asc'
          ? String(leftValue).localeCompare(String(rightValue))
          : String(rightValue).localeCompare(String(leftValue))
      }

      return sortDir === 'asc' ? leftValue - rightValue : rightValue - leftValue
    })

    return rows
  }, [metrics?.perProcessRows, sortDir, sortKey])

  const lowestWaiting = useMemo(() => {
    if (sortedRows.length === 0) {
      return null
    }

    return Math.min(...sortedRows.map((row) => row.waitingTime))
  }, [sortedRows])

  const highestWaiting = useMemo(() => {
    if (sortedRows.length === 0) {
      return null
    }

    return Math.max(...sortedRows.map((row) => row.waitingTime))
  }, [sortedRows])

  const handleSort = (key) => {
    setSortKey((currentKey) => {
      if (currentKey === key) {
        setSortDir((currentDir) => (currentDir === 'asc' ? 'desc' : 'asc'))
        return currentKey
      }

      setSortDir('asc')
      return key
    })
  }

  if (!metrics) {
    return null
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface-1">
      <table className="w-full min-w-[860px] font-mono text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border/70 text-xs uppercase tracking-wider text-text-muted">
            {['Process', ...Object.values(SORT_OPTIONS)].map((label) => {
              const key =
                label === 'Process'
                  ? 'pid'
                  : Object.keys(SORT_OPTIONS).find((optionKey) => SORT_OPTIONS[optionKey] === label) ?? 'pid'
              const active = sortKey === key

              return (
                <th key={label} className="px-3 py-3 text-left sm:px-4">
                  <button
                    type="button"
                    onClick={() => handleSort(key)}
                    className={cn('inline-flex items-center gap-1 transition', active ? 'text-accent-cyan' : 'hover:text-text-primary')}
                  >
                    {label}
                    <SortIcon active={active} direction={sortDir} />
                  </button>
                </th>
              )
            })}
          </tr>
        </thead>

        <tbody>
          {sortedRows.map((row) => {
            const isLowest = lowestWaiting !== null && row.waitingTime === lowestWaiting
            const isHighest = highestWaiting !== null && row.waitingTime === highestWaiting

            return (
              <tr
                key={row.pid}
                className={cn(
                  'border-b border-border/40 transition-colors',
                  isLowest && 'bg-accent-green/5',
                  isHighest && 'bg-red-500/5',
                )}
              >
                <td className="px-3 py-3 text-text-primary sm:px-4">
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: row.color }} aria-hidden="true" />
                    {row.name}
                  </span>
                </td>
                <td className="px-3 py-3 text-text-primary sm:px-4">{row.arrivalTime}</td>
                <td className="px-3 py-3 text-text-primary sm:px-4">{row.burstTime}</td>
                <td className="px-3 py-3 text-text-primary sm:px-4">{formatValue(row.completionTime)}</td>
                <td className="px-3 py-3 text-text-primary sm:px-4">{formatValue(row.turnaroundTime)}</td>
                <td className="px-3 py-3 text-text-primary sm:px-4">{formatValue(row.waitingTime)}</td>
                <td className="px-3 py-3 text-text-primary sm:px-4">{formatValue(row.responseTime)}</td>
              </tr>
            )
          })}

          <tr className="border-t-2 border-border bg-surface-2/50 font-bold text-text-primary">
            <td className="px-3 py-3 sm:px-4">Average</td>
            <td className="px-3 py-3 sm:px-4">—</td>
            <td className="px-3 py-3 sm:px-4">—</td>
            <td className="px-3 py-3 sm:px-4">—</td>
            <td className="px-3 py-3 sm:px-4">{metrics.summary.avgTurnaround}</td>
            <td className="px-3 py-3 sm:px-4">{metrics.summary.avgWaiting}</td>
            <td className="px-3 py-3 sm:px-4">{metrics.summary.avgResponse}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default MetricsTable