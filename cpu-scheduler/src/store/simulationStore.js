/**
 * Zustand store for simulation state and playback controls.
 */
import { create } from 'zustand'
import { ALGORITHM_REGISTRY, MLFQ_LEVEL_ALGORITHM_IDS } from '../constants/algorithms.js'
import { runScheduler } from '../engine/scheduler.js'

const DEFAULT_PARAMETERS = {
  quantum: 2,
  agingThreshold: 5,
  mlfqLevels: 3,
  mlfqQuantums: [2, 4, 8],
  mlfqLevelAlgorithms: ['ROUND_ROBIN', 'ROUND_ROBIN', 'ROUND_ROBIN'],
}

const DEFAULT_MLFQ_LEVEL_ALGORITHM = 'ROUND_ROBIN'

function normalizeMlfqAlgorithm(algorithm, fallback = DEFAULT_MLFQ_LEVEL_ALGORITHM) {
  const normalizedAlgorithm = String(algorithm ?? '').toUpperCase()

  return MLFQ_LEVEL_ALGORITHM_IDS.includes(normalizedAlgorithm) ? normalizedAlgorithm : fallback
}

function normalizeMlfqConfiguration(levels, quantums, levelAlgorithms) {
  const normalizedLevels = Math.max(1, Number(levels) || 1)
  const quantumSource = Array.isArray(quantums) && quantums.length > 0 ? quantums : DEFAULT_PARAMETERS.mlfqQuantums
  const algorithmSource =
    Array.isArray(levelAlgorithms) && levelAlgorithms.length > 0
      ? levelAlgorithms
      : DEFAULT_PARAMETERS.mlfqLevelAlgorithms

  return {
    mlfqLevels: normalizedLevels,
    mlfqQuantums: Array.from({ length: normalizedLevels }, (_, index) => {
      const fallbackQuantum = quantumSource[index] ?? quantumSource[quantumSource.length - 1] ?? 1
      const normalizedQuantum = Number(quantumSource[index] ?? fallbackQuantum)

      return Math.max(1, Number.isFinite(normalizedQuantum) ? normalizedQuantum : Number(fallbackQuantum) || 1)
    }),
    mlfqLevelAlgorithms: Array.from({ length: normalizedLevels }, (_, index) => {
      const fallbackAlgorithm = algorithmSource[index] ?? algorithmSource[algorithmSource.length - 1] ?? DEFAULT_MLFQ_LEVEL_ALGORITHM

      return normalizeMlfqAlgorithm(algorithmSource[index], normalizeMlfqAlgorithm(fallbackAlgorithm))
    }),
  }
}

const DEFAULT_ALGORITHM_ID = ALGORITHM_REGISTRY[0]?.id ?? 'FCFS'

function getTimelineEntry(timeline, index) {
  return timeline[index] ?? null
}

/**
 * Select the current timeline entry.
 *
 * @param {{timeline:Array<object>,playbackIndex:number}} state - Simulation state.
 * @returns {object|null} Current timeline entry or null.
 */
export function selectCurrentEntry(state) {
  return getTimelineEntry(state.timeline, state.playbackIndex)
}

/**
 * Select the active process pid for the current playback index.
 *
 * @param {{timeline:Array<{pid:number|null}>,playbackIndex:number}} state - Simulation state.
 * @returns {number|null} Active pid or null.
 */
export function selectActiveProcessPid(state) {
  const currentEntry = selectCurrentEntry(state)

  return currentEntry?.pid ?? null
}

/**
 * Create the simulation store.
 *
 * @returns {{algorithmId:string,status:'idle'|'running'|'paused'|'completed',currentTime:number,timeline:Array<object>,playbackIndex:number,speedMs:number,parameters:{quantum:number,agingThreshold:number,mlfqLevels:number,mlfqQuantums:number[],mlfqLevelAlgorithms:string[]},setAlgorithm:function,setStatus:function,setSpeed:function,updateParameter:function,startSimulation:function,tick:function,pauseSimulation:function,resumeSimulation:function,resetSimulation:function,stepForward:function}} Store state.
 */
export const useSimulationStore = create((set, get) => ({
  algorithmId: DEFAULT_ALGORITHM_ID,
  status: 'idle',
  currentTime: 0,
  timeline: [],
  playbackIndex: 0,
  speedMs: 800,
  parameters: { ...DEFAULT_PARAMETERS },
  setAlgorithm: (id) =>
    set(() => ({ algorithmId: id, status: 'idle', currentTime: 0, timeline: [], playbackIndex: 0 })),
  setStatus: (status) =>
    set(() => ({ status })),
  setSpeed: (ms) =>
    set(() => ({ speedMs: Math.max(0, Number(ms) || 0) })),
  updateParameter: (key, value) =>
    set((state) => {
      const nextParameters = { ...state.parameters, [key]: value }

      if (key === 'mlfqLevels' || key === 'mlfqQuantums' || key === 'mlfqLevelAlgorithms') {
        const normalized = normalizeMlfqConfiguration(
          nextParameters.mlfqLevels,
          nextParameters.mlfqQuantums,
          nextParameters.mlfqLevelAlgorithms,
        )

        nextParameters.mlfqLevels = normalized.mlfqLevels
        nextParameters.mlfqQuantums = normalized.mlfqQuantums
        nextParameters.mlfqLevelAlgorithms = normalized.mlfqLevelAlgorithms
      }

      return { parameters: nextParameters }
    }),
  startSimulation: (processes) => {
    const state = get()
    const { timeline, completionMap } = runScheduler(state.algorithmId, processes, state.parameters)

    void completionMap

    set(() => ({ timeline, status: 'running', currentTime: 0, playbackIndex: 0 }))
  },
  tick: () => {
    const state = get()
    if (state.status !== 'running') return

    const nextIndex = state.playbackIndex + 1
    const currentEntry = getTimelineEntry(state.timeline, nextIndex)
    const currentTime = currentEntry ? currentEntry.end : state.timeline[state.timeline.length - 1]?.end ?? state.currentTime
    const isCompleted = state.timeline.length > 0 && nextIndex >= state.timeline.length - 1

    set(() => ({ playbackIndex: nextIndex, currentTime, status: isCompleted ? 'completed' : state.status }))
  },
  pauseSimulation: () =>
    set(() => ({ status: 'paused' })),
  resumeSimulation: () =>
    set(() => ({ status: 'running' })),
  resetSimulation: () =>
    set(() => ({ status: 'idle', currentTime: 0, playbackIndex: 0, timeline: [] })),
  stepForward: () =>
    set((state) => {
      const nextIndex = Math.min(state.playbackIndex + 1, state.timeline.length)
      const currentEntry = getTimelineEntry(state.timeline, nextIndex)
      const currentTime = currentEntry ? currentEntry.end : state.timeline.length > 0 ? state.timeline[state.timeline.length - 1].end : state.currentTime
      const isCompleted = state.timeline.length > 0 && nextIndex >= state.timeline.length - 1

      return { playbackIndex: nextIndex, currentTime, status: isCompleted ? 'completed' : state.status }
    }),
}))

export default useSimulationStore