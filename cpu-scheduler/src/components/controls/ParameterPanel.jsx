/**
 * Algorithm-aware simulation parameter controls.
 */
import { useMemo } from 'react'
import { ALGORITHM_REGISTRY, MLFQ_LEVEL_ALGORITHM_IDS } from '../../constants/algorithms.js'
import { useSimulationStore } from '../../store/simulationStore.js'

function ParameterField({ label, value, onChange, min, max, step = 1, ...inputProps }) {
  return (
    <label className="block space-y-2">
      <span className="block font-body text-xs uppercase tracking-wider text-text-muted">{label}</span>
      <input
        {...inputProps}
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={onChange}
        className="w-full rounded border border-border bg-surface-2 px-3 py-2 font-mono text-text-primary outline-none transition focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
      />
    </label>
  )
}

/**
 * Render the parameter configuration panel.
 *
 * @returns {JSX.Element} Parameter panel UI.
 */
export function ParameterPanel() {
  const algorithmId = useSimulationStore((state) => state.algorithmId)
  const parameters = useSimulationStore((state) => state.parameters)
  const updateParameter = useSimulationStore((state) => state.updateParameter)

  const selectedAlgorithm = useMemo(
    () => ALGORITHM_REGISTRY.find((algorithm) => algorithm.id === algorithmId) ?? ALGORITHM_REGISTRY[0],
    [algorithmId],
  )

  const levelAlgorithmOptions = useMemo(
    () => ALGORITHM_REGISTRY.filter((algorithm) => MLFQ_LEVEL_ALGORITHM_IDS.includes(algorithm.id)),
    [],
  )

  const hasAnyExtraParameter = selectedAlgorithm.hasQuantum || selectedAlgorithm.hasAging || selectedAlgorithm.hasLevels

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-3">
      <p className="text-sm text-text-muted">{selectedAlgorithm.description}</p>

      {selectedAlgorithm.hasQuantum && !selectedAlgorithm.hasLevels ? (
        <ParameterField
          label="Quantum"
          value={parameters.quantum}
          min={1}
          max={20}
          onChange={(event) => updateParameter('quantum', Number(event.target.value))}
          inputMode="numeric"
          pattern="[0-9]*"
        />
      ) : null}

      {selectedAlgorithm.hasAging ? (
        <ParameterField
          label="Aging Threshold"
          value={parameters.agingThreshold}
          min={1}
          max={20}
          onChange={(event) => updateParameter('agingThreshold', Number(event.target.value))}
          inputMode="numeric"
          pattern="[0-9]*"
        />
      ) : null}

      {selectedAlgorithm.hasLevels ? (
        <div className="grid gap-3">
          <ParameterField
            label="MLFQ Levels"
            value={parameters.mlfqLevels}
            min={2}
            max={5}
            onChange={(event) => updateParameter('mlfqLevels', Number(event.target.value))}
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <div className="grid gap-2">
            {parameters.mlfqQuantums.map((quantum, index) => {
              const levelAlgorithm = parameters.mlfqLevelAlgorithms[index] ?? 'ROUND_ROBIN'
              const requiresQuantum = levelAlgorithm === 'ROUND_ROBIN'
              return (
                <div key={`mlfq-${index}`} className="grid gap-2 rounded-lg border border-border bg-surface-1 p-3">
                  <label className="block space-y-2">
                    <span className="block font-body text-xs uppercase tracking-wider text-text-muted">
                      Level {index + 1} Algorithm
                    </span>
                    <select
                      value={levelAlgorithm}
                      onChange={(event) => {
                        const nextAlgorithms = [...parameters.mlfqLevelAlgorithms]
                        nextAlgorithms[index] = event.target.value
                        updateParameter('mlfqLevelAlgorithms', nextAlgorithms)
                      }}
                      className="w-full rounded border border-border bg-surface-2 px-3 py-2 font-body text-text-primary outline-none transition focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/20"
                    >
                      {levelAlgorithmOptions.map((algorithm) => (
                        <option key={algorithm.id} value={algorithm.id}>
                          {algorithm.shortLabel} - {algorithm.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  {requiresQuantum ? (
                    <ParameterField
                      label={`Level ${index + 1} Quantum`}
                      value={quantum}
                      min={1}
                      max={20}
                      onChange={(event) => {
                        const nextQuantums = [...parameters.mlfqQuantums]
                        nextQuantums[index] = Number(event.target.value)
                        updateParameter('mlfqQuantums', nextQuantums)
                      }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                    />
                  ) : (
                    <p className="text-xs text-text-muted italic">
                      {levelAlgorithm} does not use quantum
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : null}

      {!hasAnyExtraParameter ? (
        <p className="text-sm text-text-faint">No extra parameters required for this algorithm.</p>
      ) : null}
    </div>
  )
}

export default ParameterPanel