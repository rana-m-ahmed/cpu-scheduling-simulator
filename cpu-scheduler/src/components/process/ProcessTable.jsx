/**
 * Animated process table with inline edit and delete controls.
 */
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { useProcessStore } from '../../store/processStore.js'
import { useSimulator } from '../../hooks/useSimulator.js'
import { useMetrics } from '../../hooks/useMetrics.js'
import { cn } from '../../utils/cn.js'
import { ProcessForm } from './ProcessForm.jsx'

function getStatusLabel(process, activeProcessPid, completedPidSet, currentTime) {
  if (process.pid === activeProcessPid) {
    return 'Running'
  }

  if (completedPidSet.has(process.pid)) {
    return 'Completed'
  }

  if (process.arrivalTime <= currentTime) {
    return 'Ready'
  }

  return 'Idle'
}

function statusClasses(status) {
  switch (status) {
    case 'Running':
      return 'bg-accent-green/20 text-accent-green border border-accent-green/30'
    case 'Ready':
      return 'bg-accent-amber/20 text-accent-amber border border-accent-amber/30'
    case 'Completed':
      return 'bg-text-faint/20 text-text-faint border border-text-faint/30'
    default:
      return 'text-text-faint'
  }
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border/80 px-6 py-14 text-center text-text-muted">
      <p className="font-display text-xl text-text-primary">No processes added yet.</p>
      <p className="mt-2 text-sm">Add a process to begin.</p>
    </div>
  )
}

/**
 * Render the process table with edit/delete actions and live status labels.
 *
 * @returns {JSX.Element} Process table UI.
 */
export function ProcessTable() {
  const processes = useProcessStore((state) => state.processes)
  const removeProcess = useProcessStore((state) => state.removeProcess)
  const { status, activeProcessPid, currentTime } = useSimulator()
  const metrics = useMetrics()
  const [editingPid, setEditingPid] = useState(null)

  const completedPidSet = useMemo(() => new Set(metrics?.raw?.completionOrder ?? []), [metrics])

  const editingProcess = useMemo(
    () => processes.find((process) => process.pid === editingPid) ?? null,
    [editingPid, processes],
  )

  const handleDelete = (pid) => {
    if (status === 'running') {
      return
    }

    removeProcess(pid)

    if (editingPid === pid) {
      setEditingPid(null)
    }
  }

  const handleEditComplete = () => {
    setEditingPid(null)
  }

  if (processes.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-border bg-surface-1/80 shadow-2xl shadow-black/20">
      <table className="w-full min-w-[980px] font-mono text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-border/70 text-xs uppercase tracking-widest text-text-muted">
            <th className="px-3 py-4 text-left sm:px-4">Color Dot</th>
            <th className="px-3 py-4 text-left sm:px-4">PID</th>
            <th className="px-3 py-4 text-left sm:px-4">Name</th>
            <th className="px-3 py-4 text-left sm:px-4">Arrival</th>
            <th className="px-3 py-4 text-left sm:px-4">Burst</th>
            <th className="px-3 py-4 text-left sm:px-4">Priority</th>
            <th className="px-3 py-4 text-left sm:px-4">Type</th>
            <th className="px-3 py-4 text-left sm:px-4">Status</th>
            <th className="px-3 py-4 text-left sm:px-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          <AnimatePresence initial={false}>
            {processes.map((process) => {
              const statusLabel = getStatusLabel(process, activeProcessPid, completedPidSet, currentTime)
              const isEditing = editingPid === process.pid

              return (
                <motion.tr
                  key={process.pid}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.18 }}
                  className={cn('border-b border-border/40 transition-colors hover:bg-surface-2/50', isEditing && 'bg-surface-2/40')}
                >
                  <td className="px-3 py-4 align-top sm:px-4">
                    <span
                      className="inline-block h-3 w-3 rounded-full shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                      style={{ backgroundColor: process.color }}
                      aria-hidden="true"
                    />
                  </td>
                  <td className="px-3 py-4 align-top text-text-primary sm:px-4">{process.pid}</td>
                  <td className="px-3 py-4 align-top text-text-primary sm:px-4">{process.name}</td>
                  <td className="px-3 py-4 align-top text-text-primary sm:px-4">{process.arrivalTime}</td>
                  <td className="px-3 py-4 align-top text-text-primary sm:px-4">{process.burstTime}</td>
                  <td className="px-3 py-4 align-top text-text-primary sm:px-4">{process.priority}</td>
                  <td className="px-3 py-4 align-top text-text-primary sm:px-4">{process.type}</td>
                  <td className="px-3 py-4 align-top sm:px-4">
                    <span className={cn('inline-flex rounded-full px-2 py-0.5 text-xs font-mono', statusClasses(statusLabel))}>
                      {statusLabel}
                    </span>
                  </td>
                  <td className="px-3 py-4 align-top sm:px-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Edit process ${process.name}`}
                        onClick={() => setEditingPid((current) => (current === process.pid ? null : process.pid))}
                        className="rounded border border-border bg-surface px-2.5 py-2 text-text-muted transition hover:border-accent-cyan hover:text-accent-cyan"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete process ${process.name}`}
                        onClick={() => handleDelete(process.pid)}
                        disabled={status === 'running'}
                        title={status === 'running' ? 'Pause simulation to modify processes' : undefined}
                        className="rounded border border-border bg-surface px-2.5 py-2 text-text-muted transition hover:border-red-400 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </AnimatePresence>

          {editingProcess ? (
            <tr>
              <td colSpan={9} className="px-3 py-4 sm:px-4">
                <ProcessForm
                  key={editingProcess.pid}
                  editingProcess={editingProcess}
                  onSubmit={handleEditComplete}
                />
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  )
}

export default ProcessTable