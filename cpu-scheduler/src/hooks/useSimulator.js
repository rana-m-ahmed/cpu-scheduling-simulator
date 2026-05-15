/**
 * React hook that drives simulation playback and exposes the control API.
 *
 * @returns {{status:'idle'|'running'|'paused'|'completed',currentTime:number,activeProcessPid:number|null,currentEntry:object|null,timeline:Array<object>,playbackIndex:number,speed:number,start:function,pause:function,resume:function,reset:function,step:function,setSpeed:function}} Simulator control state.
 */
import { useEffect, useMemo } from 'react'
import { useRef } from 'react'
import { selectActiveProcessPid, selectCurrentEntry, useSimulationStore } from '../store/simulationStore.js'
import { useProcessStore } from '../store/processStore.js'
import { useMetricsStore } from '../store/metricsStore.js'

let sharedIntervalId = null
let sharedIntervalSpeed = null
let sharedIntervalTick = null
let sharedIntervalUsers = 0

function startSharedInterval(speedMs, tick) {
  if (sharedIntervalId !== null) {
    window.clearInterval(sharedIntervalId)
  }

  sharedIntervalTick = tick
  sharedIntervalSpeed = speedMs
  sharedIntervalId = window.setInterval(() => {
    sharedIntervalTick()
  }, speedMs)
}

function stopSharedInterval() {
  if (sharedIntervalId !== null) {
    window.clearInterval(sharedIntervalId)
    sharedIntervalId = null
    sharedIntervalSpeed = null
    sharedIntervalTick = null
  }
}

export function useSimulator() {
  const status = useSimulationStore((state) => state.status)
  const currentTime = useSimulationStore((state) => state.currentTime)
  const timeline = useSimulationStore((state) => state.timeline)
  const playbackIndex = useSimulationStore((state) => state.playbackIndex)
  const speedMs = useSimulationStore((state) => state.speedMs)
  const tick = useSimulationStore((state) => state.tick)
  const startSimulation = useSimulationStore((state) => state.startSimulation)
  const pauseSimulation = useSimulationStore((state) => state.pauseSimulation)
  const resumeSimulation = useSimulationStore((state) => state.resumeSimulation)
  const resetSimulation = useSimulationStore((state) => state.resetSimulation)
  const stepForward = useSimulationStore((state) => state.stepForward)
  const setSpeed = useSimulationStore((state) => state.setSpeed)
  const algorithmId = useSimulationStore((state) => state.algorithmId)
  const currentEntry = useMemo(
    () => selectCurrentEntry({ timeline, playbackIndex }),
    [timeline, playbackIndex],
  )
  const activeProcessPid = useMemo(
    () => selectActiveProcessPid({ timeline, playbackIndex }),
    [timeline, playbackIndex],
  )
  const processes = useProcessStore((state) => state.processes)
  const resetProcessRemainingTimes = useProcessStore(
    (state) => state.resetProcessRemainingTimes,
  )
  const computeAndStore = useMetricsStore((state) => state.computeAndStore)
  const prevStatusRef = useRef(status)

  useEffect(() => {
    if (status !== 'running') {
      return undefined
    }

    sharedIntervalUsers += 1

    if (sharedIntervalId === null || sharedIntervalSpeed !== speedMs || sharedIntervalTick !== tick) {
      startSharedInterval(speedMs, tick)
    }

    return () => {
      sharedIntervalUsers = Math.max(0, sharedIntervalUsers - 1)

      if (sharedIntervalUsers === 0) {
        stopSharedInterval()
      }
    }
  }, [status, speedMs, tick])

  useEffect(() => {
    // Compute metrics once when simulation transitions to completed
    if (status === 'completed' && prevStatusRef.current !== 'completed') {
      computeAndStore(timeline, processes)
    }

    prevStatusRef.current = status
  }, [algorithmId, computeAndStore, processes, status, timeline])

  return {
    status,
    currentTime,
    activeProcessPid,
    currentEntry,
    timeline,
    playbackIndex,
    speed: speedMs,
    start: () => startSimulation(processes),
    pause: pauseSimulation,
    resume: resumeSimulation,
    reset: () => {
      resetSimulation()
      resetProcessRemainingTimes()
    },
    step: stepForward,
    setSpeed,
  }
}