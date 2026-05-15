/**
 * Algorithm selection panel.
 */
import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { ALGORITHM_REGISTRY } from '../../constants/algorithms.js'
import { useSimulationStore } from '../../store/simulationStore.js'
import { cn } from '../../utils/cn.js'

/**
 * Render the scheduling algorithm selector.
 *
 * @returns {JSX.Element} Algorithm selector UI.
 */
export function AlgorithmSelector() {
  const algorithmId = useSimulationStore((state) => state.algorithmId)
  const setAlgorithm = useSimulationStore((state) => state.setAlgorithm)

  const activeAlgorithm = useMemo(
    () => ALGORITHM_REGISTRY.find((algorithm) => algorithm.id === algorithmId) ?? ALGORITHM_REGISTRY[0],
    [algorithmId],
  )

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-surface-2 p-3">
        <p className="font-display text-sm font-bold text-text-primary">{activeAlgorithm.label}</p>
        <p className="mt-1 text-sm text-text-muted">{activeAlgorithm.description}</p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
        {ALGORITHM_REGISTRY.map((algorithm) => {
          const isActive = algorithm.id === algorithmId

          return (
            <motion.button
              key={algorithm.id}
              type="button"
              onClick={() => setAlgorithm(algorithm.id)}
              whileHover={{ y: -1 }}
              className={cn(
                'rounded-lg border p-3 text-left transition',
                isActive ? 'border-accent-cyan bg-accent-cyan/10' : 'border-border bg-surface-2 hover:border-accent-cyan/50',
              )}
              aria-label={`Select algorithm ${algorithm.label}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-text-faint">{algorithm.shortLabel}</p>
                  <p className="font-display text-sm font-bold text-text-primary">
                    {algorithm.label}
                    <span className="ml-2 inline-block" title={algorithm.description} aria-hidden="true">
                      <Info className="inline h-3 w-3 text-text-muted" />
                    </span>
                  </p>
                </div>
                <span className={cn('rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider', isActive ? 'border-accent-cyan text-accent-cyan' : 'border-border text-text-muted')}>
                  {isActive ? 'active' : 'select'}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default AlgorithmSelector