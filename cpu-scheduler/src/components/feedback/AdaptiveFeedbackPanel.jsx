/**
 * Real-time adaptive feedback panel for the CPU scheduling simulator.
 */
import { AnimatePresence, motion } from 'framer-motion'
import { Brain, CheckCircle2, Cpu, TriangleAlert } from 'lucide-react'
import { ALGORITHM_REGISTRY } from '../../constants/algorithms.js'
import { useAdaptiveFeedback } from '../../hooks/useAdaptiveFeedback.js'
import { useSimulator } from '../../hooks/useSimulator.js'
import { useSimulationStore } from '../../store/simulationStore.js'
import { cn } from '../../utils/cn.js'
import StatusDot from '../layout/StatusDot.jsx'

function getSeverityStyles(severity) {
  return severity === 'critical'
    ? 'border-accent-red bg-accent-red/5 text-accent-red'
    : 'border-accent-amber bg-accent-amber/5 text-accent-amber'
}

function getConfidenceStyles(confidence) {
  switch (confidence) {
    case 'high':
      return 'border-accent-green/30 bg-accent-green/10 text-accent-green'
    case 'medium':
      return 'border-accent-amber/30 bg-accent-amber/10 text-accent-amber'
    default:
      return 'border-border bg-surface text-text-muted'
  }
}

/**
 * Show starvation alerts and adaptive algorithm recommendations.
 *
 * @returns {JSX.Element} Adaptive feedback UI.
 */
export function AdaptiveFeedbackPanel() {
  const { status, currentTime } = useSimulator()
  const { starvationAlerts, recommendation, hasAlerts } = useAdaptiveFeedback()
  const setAlgorithm = useSimulationStore((state) => state.setAlgorithm)
  const suggestedLabel = recommendation.suggestedAlgorithm
    ? ALGORITHM_REGISTRY.find((algorithm) => algorithm.id === recommendation.suggestedAlgorithm)?.label ??
      recommendation.suggestedAlgorithm
    : null

  return (
    <motion.aside
      className="rounded-3xl border border-border bg-surface-1 p-4 shadow-2xl shadow-black/20 sm:p-5"
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div className="mb-4 flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Adaptive feedback</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">Realtime advisor</h2>
        </div>

        <div className="inline-flex self-start items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 font-mono text-xs text-text-muted sm:self-auto">
          <StatusDot status={status} />
        </div>
      </div>

      <div className="space-y-5">
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <TriangleAlert className="h-4 w-4 text-text-muted" />
            <h3 className="font-mono text-sm uppercase tracking-wider text-text-primary">⚠ Starvation Monitor</h3>
          </div>

          {hasAlerts ? (
            <AnimatePresence initial={false} mode="popLayout">
              {starvationAlerts.map((alert) => (
                <motion.div
                  key={`${alert.pid}-${alert.severity}-${currentTime}`}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                  className={cn(
                    'rounded-xl border px-3 py-3 shadow-sm sm:px-4',
                    getSeverityStyles(alert.severity),
                    alert.severity === 'critical' && 'animate-pulse',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-mono text-sm text-text-primary">P{alert.pid} — waiting {alert.waitingTime} ticks</p>
                    <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider', getSeverityStyles(alert.severity))}>
                      {alert.severity}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="rounded-xl border border-border bg-surface-2/50 px-4 py-3 text-sm text-text-faint">
              No starvation detected
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-text-muted" />
            <h3 className="font-mono text-sm uppercase tracking-wider text-text-primary">AI Advisor</h3>
          </div>

          {status === 'idle' ? (
            <div className="rounded-xl border border-border bg-surface-2/50 px-4 py-4 text-sm text-text-muted">
              Start simulation to receive recommendations
            </div>
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${recommendation.shouldSwitch}-${recommendation.suggestedAlgorithm ?? 'current'}-${recommendation.confidence}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className={cn(
                  'rounded-2xl border p-4 sm:p-5',
                  recommendation.shouldSwitch ? 'border-accent-cyan bg-accent-cyan/5' : 'border-accent-green/30 bg-accent-green/5',
                )}
              >
                {recommendation.shouldSwitch ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">Suggested: {suggestedLabel}</p>
                        <p className="mt-1 text-sm text-text-muted">{recommendation.reason}</p>
                      </div>
                      <span className={cn('rounded-full border px-2 py-1 font-mono text-[10px] uppercase tracking-wider', getConfidenceStyles(recommendation.confidence))}>
                        {String(recommendation.confidence)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (!recommendation.suggestedAlgorithm) {
                          return
                        }

                        setAlgorithm(recommendation.suggestedAlgorithm)
                      }}
                      disabled={status === 'running' || !recommendation.suggestedAlgorithm}
                      className="inline-flex items-center gap-2 rounded-md border border-accent-cyan px-3 py-2 font-mono text-xs text-accent-cyan transition hover:bg-accent-cyan/10 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Cpu className="h-3.5 w-3.5" />
                      Switch Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-accent-green">
                      <CheckCircle2 className="h-4 w-4" />
                      <p className="font-medium">Current algorithm optimal</p>
                    </div>
                    <p className="text-sm text-text-muted">{recommendation.reason}</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </section>
      </div>
    </motion.aside>
  )
}

export default AdaptiveFeedbackPanel