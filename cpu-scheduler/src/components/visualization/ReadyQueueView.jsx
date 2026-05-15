/**
 * Real-time ready queue view for the CPU scheduling simulator.
 */
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { useProcessStore } from '../../store/processStore.js'
import { useSimulator } from '../../hooks/useSimulator.js'

function getExecutedMaps(timeline, playbackIndex, currentTime) {
  const executedByPid = new Map()
  const completionByPid = new Map()
  const safePlaybackIndex = Math.max(0, Math.min(Number(playbackIndex) || 0, timeline.length - 1))

  for (let index = 0; index <= safePlaybackIndex; index += 1) {
    const segment = timeline[index]

    if (!segment || segment.pid === null) {
      continue
    }

    const start = Number(segment.start ?? 0)
    const end = Number(segment.end ?? 0)

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start || end > currentTime) {
      continue
    }

    const executedTime = end - start
    const nextExecuted = (executedByPid.get(segment.pid) ?? 0) + executedTime

    executedByPid.set(segment.pid, nextExecuted)
    completionByPid.set(segment.pid, end)
  }

  return { executedByPid, completionByPid }
}

function ReadyQueueChip({ process, remainingTime }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94, x: -8 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.94, x: 24 }}
      transition={{ type: 'spring', stiffness: 420, damping: 30 }}
      className="flex items-center justify-between gap-4 rounded-r-lg border-l-4 border-border bg-surface-2 px-3 py-2 text-sm font-mono"
      style={{ borderLeftColor: process.color }}
    >
      <div className="min-w-0 space-y-0.5">
        <p className="truncate font-bold text-text-primary">{process.name}</p>
        <p className="text-xs text-text-muted">PID {process.pid}</p>
      </div>
      <span className="shrink-0 rounded-full border border-border bg-surface-1 px-2 py-1 text-xs text-text-muted">
        rem: {remainingTime}t
      </span>
    </motion.div>
  )
}

function RunningChip({ process, remainingTime }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.94, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, y: -8 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-surface-2 px-4 py-3"
      style={{ boxShadow: `0 0 0 1px ${process.color}33` }}
    >
      <span
        className="absolute inset-0 rounded-2xl border opacity-50 animate-pulse"
        style={{ borderColor: process.color }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex items-center justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-1 px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-text-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: process.color }} aria-hidden="true" />
            ▶ running
          </div>
          <p className="truncate font-display text-lg font-semibold text-text-primary">{process.name}</p>
          <p className="font-mono text-xs text-text-muted">PID {process.pid}</p>
        </div>

        <span className="shrink-0 rounded-full border border-accent-green/40 bg-accent-green/10 px-3 py-1 font-mono text-xs font-bold text-accent-green">
          rem: {remainingTime}t
        </span>
      </div>
    </motion.div>
  )
}

/**
 * Show the current ready queue and running process.
 *
 * @returns {JSX.Element} Ready queue UI.
 */
export function ReadyQueueView() {
  const { timeline, playbackIndex, currentTime, activeProcessPid } = useSimulator()
  const processes = useProcessStore((state) => state.processes)

  const viewModel = useMemo(() => {
    const { executedByPid } = getExecutedMaps(timeline, playbackIndex, currentTime)
    const runningProcess = processes.find((process) => process.pid === activeProcessPid) ?? null
    const readyQueue = []

    for (const process of processes) {
      const executedTime = executedByPid.get(process.pid) ?? 0
      const remainingTime = Math.max(0, Number(process.burstTime ?? 0) - executedTime)
      const isRunning = process.pid === activeProcessPid
      const isCompleted = executedTime >= Number(process.burstTime ?? 0) && !isRunning
      const isArrived = Number(process.arrivalTime ?? 0) <= currentTime

      if (isRunning || isCompleted || !isArrived) {
        continue
      }

      readyQueue.push({
        ...process,
        remainingTime,
      })
    }

    readyQueue.sort((left, right) => {
      if (left.remainingTime !== right.remainingTime) {
        return left.remainingTime - right.remainingTime
      }

      if (left.arrivalTime !== right.arrivalTime) {
        return left.arrivalTime - right.arrivalTime
      }

      return left.pid - right.pid
    })

    return {
      readyQueue,
      runningProcess: runningProcess
        ? {
            ...runningProcess,
            remainingTime: Math.max(
              0,
              Number(runningProcess.burstTime ?? 0) - (executedByPid.get(runningProcess.pid) ?? 0),
            ),
          }
        : null,
    }
  }, [activeProcessPid, currentTime, playbackIndex, processes, timeline])

  return (
    <div className="rounded-3xl border border-border bg-surface-1 p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Realtime state</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">Ready queue</h2>
        </div>
        <div className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-text-muted">
          t = {currentTime}
        </div>
      </div>

      <div className="space-y-4">
        {viewModel.runningProcess ? (
          <div className="space-y-2">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-text-muted">Currently running</p>
            <RunningChip process={viewModel.runningProcess} remainingTime={viewModel.runningProcess.remainingTime} />
          </div>
        ) : null}

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-text-muted">Ready</p>
            <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs text-text-muted">
              {viewModel.readyQueue.length} processes
            </span>
          </div>

          <AnimatePresence initial={false} mode="popLayout">
            {viewModel.readyQueue.length > 0 ? (
              viewModel.readyQueue.map((process) => (
                <ReadyQueueChip key={process.pid} process={process} remainingTime={process.remainingTime} />
              ))
            ) : (
              <motion.p
                key="ready-empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="rounded-lg border border-dashed border-border/70 bg-surface-2/40 px-4 py-5 text-center font-mono text-sm text-text-faint"
              >
                Queue empty — CPU idle
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default ReadyQueueView