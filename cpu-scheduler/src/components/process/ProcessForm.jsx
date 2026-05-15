/**
 * Add/edit process form for the CPU scheduling simulator.
 */
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useProcessStore } from '../../store/processStore.js'
import { useSimulator } from '../../hooks/useSimulator.js'
import { cn } from '../../utils/cn.js'

const DEFAULT_FORM = {
  name: '',
  arrivalTime: '0',
  burstTime: '1',
  priority: '5',
  type: 'cpu',
}

function toInputValue(value, fallback) {
  return String(value ?? fallback)
}

function getInitialValues(editingProcess) {
  if (!editingProcess) {
    return DEFAULT_FORM
  }

  return {
    name: editingProcess.name ?? '',
    arrivalTime: toInputValue(editingProcess.arrivalTime, '0'),
    burstTime: toInputValue(editingProcess.burstTime, '1'),
    priority: toInputValue(editingProcess.priority, '5'),
    type: editingProcess.type ?? 'cpu',
  }
}

/**
 * Render a form for creating or editing a single process.
 *
 * @param {{editingProcess?: object|null,onSubmit?: function}} props - Form props.
 * @returns {JSX.Element} Process form UI.
 */
export function ProcessForm({ editingProcess = null, onSubmit }) {
  const addProcess = useProcessStore((state) => state.addProcess)
  const updateProcess = useProcessStore((state) => state.updateProcess)
  const { status } = useSimulator()
  const isEditing = Boolean(editingProcess)
  const isDisabled = status === 'running'
  const [values, setValues] = useState(() => getInitialValues(editingProcess))
  const [errors, setErrors] = useState({})

  const title = useMemo(() => (isEditing ? 'Edit process' : 'Add process'), [isEditing])

  const validate = () => {
    const nextErrors = {}
    const trimmedName = values.name.trim()
    const arrivalTime = Number(values.arrivalTime)
    const burstTime = Number(values.burstTime)

    if (!trimmedName) {
      nextErrors.name = 'Name is required.'
    }

    if (!Number.isFinite(arrivalTime) || arrivalTime < 0) {
      nextErrors.arrivalTime = 'Arrival time must be 0 or greater.'
    }

    if (!Number.isFinite(burstTime) || burstTime < 1) {
      nextErrors.burstTime = 'Burst time must be at least 1.'
    }

    if (values.priority && (!Number.isFinite(Number(values.priority)) || Number(values.priority) < 1 || Number(values.priority) > 10)) {
      nextErrors.priority = 'Priority must be between 1 and 10.'
    }

    setErrors(nextErrors)

    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (event) => {
    const { name, value } = event.target

    setValues((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    if (isDisabled || !validate()) {
      return
    }

    const payload = {
      name: values.name.trim(),
      arrivalTime: Number(values.arrivalTime),
      burstTime: Number(values.burstTime),
      priority: Number(values.priority),
      type: values.type === 'io' ? 'io' : 'cpu',
    }

    if (isEditing && editingProcess) {
      updateProcess(editingProcess.pid, payload)
      onSubmit?.()
      return
    }

    addProcess(payload)
    setValues(DEFAULT_FORM)
    setErrors({})
    onSubmit?.()
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className={cn('glass relative rounded-3xl border border-border p-4 shadow-2xl shadow-black/25 sm:p-5', isDisabled && 'opacity-75')}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      title={isDisabled ? 'Pause simulation to modify processes' : undefined}
      aria-disabled={isDisabled}
    >
      <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Process editor</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">{title}</h2>
        </div>
        <span className="rounded-full border border-accent-cyan/30 bg-accent-cyan/10 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.24em] text-accent-cyan">
          {isEditing ? 'Inline edit' : 'New process'}
        </span>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-2" disabled={isDisabled}>
        <label className="space-y-2 sm:col-span-2">
          <span className="block text-xs font-mono uppercase tracking-wider text-text-muted">
            Name
          </span>
          <input
            aria-label="Process name"
            name="name"
            type="text"
            value={values.name}
            onChange={handleChange}
            placeholder="P1"
            className="w-full rounded border border-border bg-surface-2 px-3 py-2 font-mono text-text-primary outline-none transition-all focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
          />
          {errors.name ? <p className="text-xs text-red-400">{errors.name}</p> : null}
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-mono uppercase tracking-wider text-text-muted">
            Arrival Time
          </span>
          <input
            aria-label="Arrival time"
            name="arrivalTime"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="0"
            step="1"
            value={values.arrivalTime}
            onChange={handleChange}
            className="w-full rounded border border-border bg-surface-2 px-3 py-2 font-mono text-text-primary outline-none transition-all focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
          />
          {errors.arrivalTime ? <p className="text-xs text-red-400">{errors.arrivalTime}</p> : null}
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-mono uppercase tracking-wider text-text-muted">
            Burst Time
          </span>
          <input
            aria-label="Burst time"
            name="burstTime"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="1"
            step="1"
            value={values.burstTime}
            onChange={handleChange}
            className="w-full rounded border border-border bg-surface-2 px-3 py-2 font-mono text-text-primary outline-none transition-all focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
          />
          {errors.burstTime ? <p className="text-xs text-red-400">{errors.burstTime}</p> : null}
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-mono uppercase tracking-wider text-text-muted">
            Priority
          </span>
          <input
            aria-label="Priority"
            name="priority"
            type="number"
            inputMode="numeric"
            pattern="[0-9]*"
            min="1"
            max="10"
            step="1"
            value={values.priority}
            onChange={handleChange}
            className="w-full rounded border border-border bg-surface-2 px-3 py-2 font-mono text-text-primary outline-none transition-all focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
          />
          {errors.priority ? <p className="text-xs text-red-400">{errors.priority}</p> : null}
        </label>

        <label className="space-y-2">
          <span className="block text-xs font-mono uppercase tracking-wider text-text-muted">
            Type
          </span>
          <select
            aria-label="Process type"
            name="type"
            value={values.type}
            onChange={handleChange}
            className="w-full rounded border border-border bg-surface-2 px-3 py-2 font-mono text-text-primary outline-none transition-all focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
          >
            <option value="cpu">cpu</option>
            <option value="io">io</option>
          </select>
        </label>
      </fieldset>

      <div className="mt-5 flex items-stretch justify-end gap-3">
        <button
          type="submit"
          aria-label={isEditing ? 'Save process changes' : 'Add process'}
          disabled={isDisabled}
          className="w-full rounded bg-accent-cyan px-4 py-3 font-bold text-surface transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:py-2"
        >
          {isEditing ? 'Save process' : 'Add process'}
        </button>
      </div>
    </motion.form>
  )
}

export default ProcessForm