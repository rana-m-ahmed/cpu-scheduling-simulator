/**
 * Live Gantt chart visualization for the CPU scheduling simulator.
 */
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { useProcessStore } from '../../store/processStore.js'
import { useSimulator } from '../../hooks/useSimulator.js'
import { cn } from '../../utils/cn.js'

function hexToRgba(hex, alpha) {
  const normalized = String(hex ?? '').replace('#', '')

  if (normalized.length !== 6) {
    return `rgba(34, 211, 238, ${alpha})`
  }

  const red = Number.parseInt(normalized.slice(0, 2), 16)
  const green = Number.parseInt(normalized.slice(2, 4), 16)
  const blue = Number.parseInt(normalized.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

function getMarkerStep(totalTime) {
  if (totalTime <= 0) {
    return 1
  }

  return totalTime <= 20 ? 2 : 5
}

function formatTooltip(pid, start, end) {
  if (pid === null) {
    return `Idle: t=${start} to t=${end}, duration=${end - start}`
  }

  return `P${pid}: t=${start} to t=${end}, duration=${end - start}`
}

function getIdlePattern() {
  return 'repeating-linear-gradient(135deg, rgba(72, 79, 88, 0.9) 0, rgba(72, 79, 88, 0.9) 8px, rgba(33, 38, 45, 0.95) 8px, rgba(33, 38, 45, 0.95) 16px)'
}

/**
 * Render a live, progressively revealed Gantt chart.
 *
 * @returns {JSX.Element} Gantt chart UI.
 */
export function GanttChart() {
  const { timeline, playbackIndex, currentTime } = useSimulator()
  const processes = useProcessStore((state) => state.processes)

  const chartData = useMemo(() => {
    const totalTime = timeline.length > 0 ? timeline[timeline.length - 1].end : 0
    const revealedSegments = timeline.slice(0, Math.min(playbackIndex + 1, timeline.length))
    const processByPid = new Map(processes.map((process) => [process.pid, process]))
    // Use the actual currentTime for cursor position to ensure pixel-accurate placement
    const cursorTime = Number.isFinite(currentTime) ? currentTime : 0
    const cursorLeft = totalTime > 0 ? (cursorTime / totalTime) * 100 : 0
    const markerStep = getMarkerStep(totalTime)
    const markers = []

    for (let tick = 0; tick <= totalTime; tick += markerStep) {
      markers.push({ tick, left: totalTime > 0 ? (tick / totalTime) * 100 : 0 })
    }

    if (markers.length === 0 || markers[markers.length - 1].tick !== totalTime) {
      markers.push({ tick: totalTime, left: 100 })
    }

    const uniqueLegend = []
    const seen = new Set()

    for (const segment of timeline) {
      if (segment.pid === null) {
        if (!seen.has('idle')) {
          seen.add('idle')
          uniqueLegend.push({ pid: null, name: 'Idle', color: null })
        }

        continue
      }

      if (seen.has(segment.pid)) {
        continue
      }

      seen.add(segment.pid)
      uniqueLegend.push({
        pid: segment.pid,
        name: processByPid.get(segment.pid)?.name ?? `P${segment.pid}`,
        color: processByPid.get(segment.pid)?.color ?? '#22d3ee',
      })
    }

    const segments = revealedSegments.map((segment, index) => {
      const process = segment.pid === null ? null : processByPid.get(segment.pid)
      const duration = Math.max(0, segment.end - segment.start)
      const widthPercent = totalTime > 0 ? (duration / totalTime) * 100 : 0
      const previous = revealedSegments[index - 1] ?? null
      const next = revealedSegments[index + 1] ?? null
      const isFirstOfRun = !previous || previous.pid !== segment.pid
      const isLastOfRun = !next || next.pid !== segment.pid
      const isIdle = segment.pid === null
      const showLabel = !isIdle && widthPercent >= 8

      return {
        ...segment,
        id: `${segment.pid ?? 'idle'}-${segment.start}-${segment.end}-${index}`,
        duration,
        widthPercent,
        isIdle,
        isFirstOfRun,
        isLastOfRun,
        showLabel,
        name: process?.name ?? 'Idle',
        color: process?.color ?? '#30363d',
        tooltip: formatTooltip(segment.pid, segment.start, segment.end),
      }
    })

    // Calculate minWidth so long timelines become horizontally scrollable with reasonable scale
    const minWidth = Math.max(600, totalTime * 24) // 24px per time unit heuristic

    return { totalTime, markers, segments, uniqueLegend, cursorLeft, minWidth }
  }, [currentTime, playbackIndex, processes, timeline])

  if (timeline.length === 0) {
    return (
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-1 p-3 sm:p-4">
        <div className="flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-surface-2/40 px-4 py-8 text-center text-text-muted sm:px-6">
          <div className="max-w-sm space-y-3">
            <Activity className="mx-auto h-8 w-8 text-accent-cyan/80" />
            <p className="font-display text-lg text-text-primary">Run a simulation to see the Gantt chart</p>
            <p className="text-sm leading-6">
              The timeline will reveal segment-by-segment playback and a live cursor here.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface-1 p-3 sm:p-4">
      <div className="space-y-3 sm:space-y-4" style={{ minWidth: `${chartData.minWidth}px` }}>
        <div className="relative h-8">
          {chartData.markers.map((marker) => (
            <div
              key={marker.tick}
              className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
              style={{ left: `${marker.left}%` }}
            >
              <span className="h-2 w-px bg-border" aria-hidden="true" />
              <span className="mt-1 font-mono text-[10px] uppercase tracking-wider text-text-faint">
                {marker.tick}
              </span>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="relative h-14 overflow-hidden rounded-lg border border-border bg-surface-2/60 sm:h-16">
            <div className="flex h-full w-full">
              {chartData.segments.map((segment) => {
                const segmentStyle = segment.isIdle
                  ? {
                      width: `${segment.widthPercent}%`,
                      minWidth: '20px',
                      backgroundImage: getIdlePattern(),
                    }
                  : {
                      width: `${segment.widthPercent}%`,
                      minWidth: '20px',
                      backgroundColor: hexToRgba(segment.color, 0.8),
                    }

                return (
                  <div
                    key={segment.id}
                    className={cn(
                      'group relative flex h-full shrink-0 items-center justify-center border-r border-surface-1/50 px-2 text-center font-mono text-[11px] text-text-primary',
                      segment.isFirstOfRun && 'rounded-l-lg',
                      segment.isLastOfRun && 'rounded-r-lg',
                      !segment.isIdle && 'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]',
                    )}
                    style={segmentStyle}
                    title={segment.tooltip}
                    aria-label={segment.tooltip}
                  >
                    <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded border border-border bg-surface px-2 py-1 text-[11px] text-text-primary shadow-lg shadow-black/40 group-hover:block">
                      {segment.tooltip}
                    </div>
                    {segment.showLabel ? <span className="truncate px-1">{segment.name}</span> : null}
                  </div>
                )
              })}
            </div>

            <motion.div
              layout
              className="absolute top-0 h-full w-[2px] bg-accent-cyan shadow-[0_0_8px_rgba(34,211,238,0.95)]"
              style={{ left: `${chartData.cursorLeft}%`, willChange: 'transform' }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              aria-hidden="true"
            />
          </div>

          <div className="mt-3 flex h-6 w-full overflow-hidden rounded-b-lg">
            {chartData.segments.map((segment) => (
              <div
                key={`${segment.id}-label`}
                className="flex shrink-0 items-start justify-center px-2 font-mono text-[10px] uppercase tracking-wider text-text-muted"
                style={{ width: `${segment.widthPercent}%`, minWidth: '20px' }}
              >
                {!segment.isIdle && segment.showLabel ? segment.name : null}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3 sm:gap-3 sm:pt-4">
          {chartData.uniqueLegend.map((entry) => (
            <div key={entry.pid ?? 'idle'} className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-2.5 py-1 font-mono text-[11px] text-text-muted sm:px-3 sm:py-1.5 sm:text-xs">
              {entry.pid === null ? (
                <span
                  className="h-3 w-3 rounded-sm border border-border"
                  style={{ backgroundImage: getIdlePattern() }}
                  aria-hidden="true"
                />
              ) : (
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden="true" />
              )}
              <span>{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default GanttChart