/**
 * React hook that derives adaptive recommendations and starvation feedback.
 *
 * @returns {{starvationAlerts:Array<{pid:number,waitingTime:number,severity:'warning'|'critical'}>,recommendation:{shouldSwitch:boolean,suggestedAlgorithm:string|null,reason:string,confidence:'low'|'medium'|'high'},hasAlerts:boolean}} Adaptive feedback snapshot.
 */
import { useMemo } from 'react'
import { detectStarvation } from '../engine/starvationDetector.js'
import { getRecommendation } from '../utils/adaptiveEngine.js'
import { useProcessStore } from '../store/processStore.js'
import { useSimulationStore } from '../store/simulationStore.js'

export function useAdaptiveFeedback() {
  const algorithmId = useSimulationStore((state) => state.algorithmId)
  const timeline = useSimulationStore((state) => state.timeline)
  const status = useSimulationStore((state) => state.status)
  const playbackIndex = useSimulationStore((state) => state.playbackIndex)
  const currentTime = useSimulationStore((state) => state.currentTime)
  const processes = useProcessStore((state) => state.processes)

  return useMemo(() => {
    const starvationAlerts = (status === 'running' || status === 'paused') ? detectStarvation(processes, timeline, currentTime) : []
    const recommendation = getRecommendation(processes, timeline, currentTime, algorithmId)

    void playbackIndex

    return {
      starvationAlerts,
      recommendation,
      hasAlerts: starvationAlerts.length > 0,
    }
  }, [algorithmId, currentTime, playbackIndex, processes, status, timeline])
}