/**
 * Kanban-style process state tracker for the CPU scheduling simulator.
 */
import { AnimatePresence, motion } from 'framer-motion'
import { useMemo } from 'react'
import { useProcessStore } from '../../store/processStore.js'
import { useSimulator } from '../../hooks/useSimulator.js'
import { cn } from '../../utils/cn.js'

function getExecutionState(timeline, playbackIndex, currentTime) {
  const executedByPid = new Map()
  const completionByPid = new Map()
  const lastEndByPid = new Map()
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
    executedByPid.set(segment.pid, (executedByPid.get(segment.pid) ?? 0) + executedTime)
    completionByPid.set(segment.pid, end)
    lastEndByPid.set(segment.pid, end)
  }

  return { executedByPid, completionByPid, lastEndByPid }
}

function ProcessCard({ process, state, remainingTime, waitingSince, completionTime }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'overflow-hidden rounded-xl border border-border bg-surface-2 shadow-sm',
        state === 'running' && 'border-accent-green/70 shadow-[0_0_0_1px_rgba(34,197,94,0.22),0_0_24px_rgba(34,197,94,0.12)]',
        state === 'completed' && 'opacity-70 grayscale',
      )}
    >
      <div className="h-1 w-full" style={{ backgroundColor: process.color }} aria-hidden="true" />
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="truncate font-bold text-text-primary">{process.name}</p>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-text-muted">PID {process.pid}</p>
          </div>
          <span className="shrink-0 rounded-full border border-border bg-surface px-2 py-1 font-mono text-[11px] text-text-muted">
            {state}
          </span>
        </div>

        {state === 'waiting' ? <p className="text-sm text-text-muted">Arrives at t={process.arrivalTime}</p> : null}

        {state === 'ready' ? (
          <p className="text-sm text-text-muted">
            Waiting since t={waitingSince} | Burst: {remainingTime}t left
          </p>
        ) : null}

        {state === 'running' ? (
          <p className="text-sm font-medium text-accent-green">▶ Executing | {remainingTime}t remaining</p>
        ) : null}

        {state === 'completed' ? <p className="text-sm text-text-muted">✓ Done at t={completionTime}</p> : null}
      </div>
    </motion.div>
  )
}

/**
 * Show all processes grouped by current lifecycle state.
 *
 * @returns {JSX.Element} Process tracker UI.
 */
export function ProcessStateTracker() {
  const { timeline, playbackIndex, currentTime, activeProcessPid } = useSimulator()
  const processes = useProcessStore((state) => state.processes)

  const viewModel = useMemo(() => {
    const { executedByPid, completionByPid, lastEndByPid } = getExecutionState(timeline, playbackIndex, currentTime)
    const waiting = []
    const ready = []
    const running = []
    const completed = []

    for (const process of processes) {
      const pid = process.pid
      const burstTime = Number(process.burstTime ?? 0)
      const executedTime = executedByPid.get(pid) ?? 0
      const remainingTime = Math.max(0, burstTime - executedTime)
      const waitingSince = Math.max(Number(process.arrivalTime ?? 0), lastEndByPid.get(pid) ?? Number(process.arrivalTime ?? 0))
      const completionTime = completionByPid.get(pid) ?? lastEndByPid.get(pid) ?? null
      const isRunning = pid === activeProcessPid
      const isWaiting = Number(process.arrivalTime ?? 0) > currentTime
      const isCompleted = executedTime >= burstTime && !isRunning

      const snapshot = {
        ...process,
        remainingTime,
        waitingSince,
        completionTime,
      }

      if (isRunning) {
        running.push(snapshot)
        continue
      }

      if (isCompleted) {
        completed.push(snapshot)
        continue
      }

      if (isWaiting) {
        waiting.push(snapshot)
        continue
      }

      ready.push(snapshot)
    }

    const sortByPid = (left, right) => left.pid - right.pid

    waiting.sort((left, right) => (left.arrivalTime !== right.arrivalTime ? left.arrivalTime - right.arrivalTime : sortByPid(left, right)))
    ready.sort((left, right) => (left.remainingTime !== right.remainingTime ? left.remainingTime - right.remainingTime : sortByPid(left, right)))
    running.sort(sortByPid)
    completed.sort((left, right) => {
      if (left.completionTime !== right.completionTime) {
        return left.completionTime - right.completionTime
      }

      return sortByPid(left, right)
    })

    return { waiting, ready, running, completed }
  }, [activeProcessPid, currentTime, playbackIndex, processes, timeline])

  const columns = [
    {
      key: 'waiting',
      label: 'Waiting',
      count: viewModel.waiting.length,
      items: viewModel.waiting,
    },
    {
      key: 'ready-running',
      label: 'Ready / Running',
      count: viewModel.ready.length + viewModel.running.length,
      items: [...viewModel.running, ...viewModel.ready],
    },
    {
      key: 'completed',
      label: 'Completed',
      count: viewModel.completed.length,
      items: viewModel.completed,
    },
  ]

  return (
    <div className="rounded-3xl border border-border bg-surface-1 p-5 shadow-2xl shadow-black/20">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Realtime state</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">Process tracker</h2>
        </div>
        <div className="rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-text-muted">
          t = {currentTime}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {columns.map((column) => (
          <div key={column.key} className="flex min-h-[200px] flex-1 flex-col rounded-xl border border-border bg-surface-1 p-3">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-text-muted">{column.label}</p>
              <span className="rounded-full border border-border bg-surface-2 px-2.5 py-1 font-mono text-xs text-text-muted">
                {column.count}
              </span>
            </div>

            <div className="flex-1 space-y-3">
              <AnimatePresence initial={false} mode="popLayout">
                {column.items.length > 0 ? (
                  column.items.map((process) => (
                    <ProcessCard
                      key={process.pid}
                      process={process}
                      state={
                        column.key === 'waiting'
                          ? 'waiting'
                          : column.key === 'completed'
                            ? 'completed'
                            : process.pid === activeProcessPid
                              ? 'running'
                              : 'ready'
                      }
                      remainingTime={process.remainingTime}
                      waitingSince={process.waitingSince}
                      completionTime={process.completionTime ?? '—'}
                    />
                  ))
                ) : (
                  <motion.p
                    key={`${column.key}-empty`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="rounded-lg border border-dashed border-border/70 bg-surface-2/40 px-4 py-5 text-center font-mono text-sm text-text-faint"
                  >
                    No processes in this column
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ProcessStateTracker