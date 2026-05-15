/**
 * Performance metrics dashboard container for the CPU scheduling simulator.
 */
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Clock3, Gauge, Target } from 'lucide-react'
import { useMetrics } from '../../hooks/useMetrics.js'
import { useSimulator } from '../../hooks/useSimulator.js'
import { cn } from '../../utils/cn.js'
import MetricsTable from './MetricsTable.jsx'
import MetricsChart from './MetricsChart.jsx'

function CircularProgress({ value }) {
  const safeValue = Math.max(0, Math.min(100, Number(value) || 0))
  const strokeDashoffset = 251.2 - (251.2 * safeValue) / 100

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg viewBox="0 0 100 100" className="h-20 w-20 -rotate-90">
        <circle cx="50" cy="50" r="40" className="fill-none stroke-border" strokeWidth="10" />
        <motion.circle
          cx="50"
          cy="50"
          r="40"
          className="fill-none stroke-accent-cyan"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="251.2"
          animate={{ strokeDashoffset }}
          initial={{ strokeDashoffset: 251.2 }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-center">
        <div>
          <p className="font-display text-lg font-bold text-text-primary">{safeValue.toFixed(0)}%</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-text-faint">util</p>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon, children }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0 },
      }}
      className="rounded-xl border border-border bg-surface-1 p-4"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-text-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-accent-cyan">{value}</p>
        </div>
        {Icon ? (
          <span className="rounded-lg border border-border bg-surface-2 p-2 text-text-muted">
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      {children}
    </motion.div>
  )
}

function PlaceholderCard() {
  return (
    <div className="rounded-3xl border border-border bg-surface-1 p-6 shadow-2xl shadow-black/20">
      <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-border/70 bg-surface-2/40 px-6 text-center text-text-muted">
        <div className="max-w-sm space-y-3">
          <BarChart3 className="mx-auto h-9 w-9 text-accent-cyan/80" />
          <p className="font-display text-lg text-text-primary">Metrics will appear here after the simulation completes.</p>
        </div>
      </div>
    </div>
  )
}

/**
 * Orchestrates the performance metrics display.
 *
 * @returns {JSX.Element} Metrics dashboard UI.
 */
export function MetricsDashboard() {
  const metrics = useMetrics()
  const { status, timeline } = useSimulator()

  const isReady = Boolean(metrics) && status === 'completed'

  const summaryItems = useMemo(
    () => [
      { key: 'avgWaiting', label: 'Avg Waiting Time', value: metrics?.summary.avgWaiting ?? '0.00', icon: Clock3 },
      {
        key: 'avgTurnaround',
        label: 'Avg Turnaround Time',
        value: metrics?.summary.avgTurnaround ?? '0.00',
        icon: Gauge,
      },
      { key: 'cpuUtil', label: 'CPU Utilization', value: metrics?.summary.cpuUtil ?? '0.00', icon: Target },
      { key: 'throughput', label: 'Throughput', value: metrics?.summary.throughput ?? '0.00', icon: BarChart3 },
    ],
    [metrics],
  )

  if (!isReady) {
    return <PlaceholderCard />
  }

  return (
    <motion.section
      className="space-y-5 rounded-3xl border border-border bg-surface-1 p-4 shadow-2xl shadow-black/20 sm:p-5"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Performance overview</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">Metrics dashboard</h2>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-text-faint">Simulation complete</p>
      </div>

      <motion.div
        className="grid gap-3 sm:gap-4 md:grid-cols-2"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
            },
          },
        }}
        initial="hidden"
        animate="visible"
      >
        {summaryItems.map((item) => (
          <SummaryCard key={item.key} label={item.label} value={item.value} icon={item.key === 'cpuUtil' ? null : item.icon}>
            {item.key === 'cpuUtil' ? <CircularProgress value={metrics?.raw?.cpuUtilization ?? 0} /> : null}
          </SummaryCard>
        ))}
      </motion.div>

      <div className={cn('grid gap-4 xl:grid-cols-[1.25fr_1fr]')}>
        <MetricsTable />
        <MetricsChart />
      </div>

      <div className="rounded-xl border border-border bg-surface-2/40 px-3 py-3 font-mono text-xs text-text-muted sm:px-4">
        Timeline segments captured: {timeline.length}
      </div>
    </motion.section>
  )
}

export default MetricsDashboard