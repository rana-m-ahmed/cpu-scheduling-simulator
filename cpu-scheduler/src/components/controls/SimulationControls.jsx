/**
 * Simulation transport controls and speed slider.
 */
import { Pause, Play, RotateCcw, SkipForward } from 'lucide-react'
import { useSimulator } from '../../hooks/useSimulator.js'

/**
 * Render the simulation control panel.
 *
 * @returns {JSX.Element} Simulation controls UI.
 */
export function SimulationControls() {
  const { status, start, pause, resume, reset, step, speed, setSpeed } = useSimulator()

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:flex sm:flex-wrap">
        {status === 'idle' ? (
          <>
            <button
              type="button"
              aria-label="Start simulation"
              onClick={start}
              className="inline-flex w-full items-center justify-center gap-2 rounded bg-accent-cyan px-4 py-3 font-bold text-surface transition hover:bg-cyan-300 sm:w-auto sm:py-2"
            >
              <Play className="h-4 w-4" /> Start
            </button>
            <button
              type="button"
              aria-label="Step simulation"
              onClick={step}
              className="inline-flex w-full items-center justify-center gap-2 rounded border border-border bg-surface-2 px-4 py-3 font-bold text-text-primary transition hover:border-accent-cyan hover:text-accent-cyan sm:w-auto sm:py-2"
            >
              <SkipForward className="h-4 w-4" /> Step
            </button>
          </>
        ) : null}

        {status === 'running' ? (
          <>
            <button
              type="button"
              aria-label="Pause simulation"
              onClick={pause}
              className="inline-flex w-full items-center justify-center gap-2 rounded border border-border bg-surface-2 px-4 py-3 font-bold text-text-primary transition hover:border-accent-cyan hover:text-accent-cyan sm:w-auto sm:py-2"
            >
              <Pause className="h-4 w-4" /> Pause
            </button>
            <button
              type="button"
              aria-label="Reset simulation"
              onClick={reset}
              className="inline-flex w-full items-center justify-center gap-2 rounded border border-border bg-surface-2 px-4 py-3 font-bold text-text-primary transition hover:border-accent-cyan hover:text-accent-cyan sm:w-auto sm:py-2"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </>
        ) : null}

        {status === 'paused' ? (
          <>
            <button
              type="button"
              aria-label="Resume simulation"
              onClick={resume}
              className="inline-flex w-full items-center justify-center gap-2 rounded border border-border bg-surface-2 px-4 py-3 font-bold text-text-primary transition hover:border-accent-cyan hover:text-accent-cyan sm:w-auto sm:py-2"
            >
              <Play className="h-4 w-4" /> Resume
            </button>
            <button
              type="button"
              aria-label="Step simulation"
              onClick={step}
              className="inline-flex w-full items-center justify-center gap-2 rounded border border-border bg-surface-2 px-4 py-3 font-bold text-text-primary transition hover:border-accent-cyan hover:text-accent-cyan sm:w-auto sm:py-2"
            >
              <SkipForward className="h-4 w-4" /> Step
            </button>
            <button
              type="button"
              aria-label="Reset simulation"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded border border-border bg-surface-2 px-4 py-2 font-bold text-text-primary transition hover:border-accent-cyan hover:text-accent-cyan"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </>
        ) : null}

        {status === 'completed' ? (
          <button
            type="button"
            aria-label="Reset simulation"
            onClick={reset}
            className="inline-flex w-full items-center justify-center gap-2 rounded border border-border bg-surface-2 px-4 py-3 font-bold text-text-primary transition hover:border-accent-cyan hover:text-accent-cyan sm:w-auto sm:py-2"
          >
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        ) : null}
      </div>

      <label className="block space-y-2">
        <span className="block font-body text-xs uppercase tracking-wider text-text-muted">Speed (ms)</span>
        <input
          aria-label="Simulation speed"
          type="range"
          min="100"
          max="2000"
          step="100"
          value={speed}
          onChange={(event) => setSpeed(Number(event.target.value))}
          className="w-full accent-cyan-400"
        />
      </label>
    </div>
  )
}

export default SimulationControls