/**
 * Pure workload-adaptation heuristics for scheduler recommendations.
 */

function isFiniteNumber(value) {
  return Number.isFinite(Number(value))
}

function getBurstStatistics(processes) {
  const burstTimes = (Array.isArray(processes) ? processes : [])
    .map((process) => Number(process?.burstTime ?? 0))
    .filter((burstTime) => Number.isFinite(burstTime) && burstTime >= 0)

  if (burstTimes.length === 0) {
    return { allSame: true, ratio: 0 }
  }

  const minBurst = Math.min(...burstTimes)
  const maxBurst = Math.max(...burstTimes)
  const allSame = burstTimes.every((burstTime) => burstTime === burstTimes[0])

  return {
    allSame,
    ratio: minBurst <= 0 ? Number.POSITIVE_INFINITY : maxBurst / minBurst,
  }
}

function getWaitingTime(process, currentTime) {
  const arrivalTime = Number(process?.arrivalTime ?? 0)
  const burstTime = Number(process?.burstTime ?? 0)
  const remainingTime = Number(process?.remainingTime ?? burstTime)
  const executedTime = Math.max(0, burstTime - Math.max(0, remainingTime))

  return Math.max(0, currentTime - arrivalTime - executedTime)
}

/**
 * Compute an algorithm recommendation for the current workload.
 *
 * @param {Array<object>} processes - Current process list.
 * @param {Array<{pid:number|null,start:number,end:number}>} timeline - Current simulation timeline.
 * @param {number} currentTime - Simulation clock.
 * @param {string} currentAlgorithmId - Active algorithm id.
 * @returns {{shouldSwitch:boolean,suggestedAlgorithm:string|null,reason:string,confidence:'low'|'medium'|'high'}} Recommendation object.
 */
export function getRecommendation(processes, timeline, currentTime, currentAlgorithmId) {
  const safeProcesses = Array.isArray(processes) ? processes : []
  const safeCurrentTime = isFiniteNumber(currentTime) ? Number(currentTime) : 0
  const currentId = String(currentAlgorithmId ?? '')

  if (safeProcesses.length === 0) {
    return {
      shouldSwitch: false,
      suggestedAlgorithm: null,
      reason: 'No processes available for recommendation',
      confidence: 'low',
    }
  }

  const starvationRisk = safeProcesses.some((process) => getWaitingTime(process, safeCurrentTime) > 15)
  if (starvationRisk) {
    return {
      shouldSwitch: currentId !== 'MLFQ',
      suggestedAlgorithm: 'MLFQ',
      reason: 'Starvation risk detected',
      confidence: 'high',
    }
  }

  const burstStats = getBurstStatistics(safeProcesses)
  if (burstStats.allSame) {
    return {
      shouldSwitch: currentId !== 'FCFS',
      suggestedAlgorithm: 'FCFS',
      reason: 'Uniform burst times — FCFS is optimal',
      confidence: 'high',
    }
  }

  const hasIoBoundProcesses = safeProcesses.some((process) => process?.type === 'io')
  if (hasIoBoundProcesses && currentId !== 'ROUND_ROBIN') {
    return {
      shouldSwitch: true,
      suggestedAlgorithm: 'ROUND_ROBIN',
      reason: 'I/O-bound processes benefit from time-sharing',
      confidence: 'medium',
    }
  }

  if (
    burstStats.ratio > 3 &&
    currentId !== 'SJF' &&
    currentId !== 'SRTF'
  ) {
    return {
      shouldSwitch: true,
      suggestedAlgorithm: 'SRTF',
      reason: 'High burst variance — preemptive SJF minimizes average waiting time',
      confidence: 'medium',
    }
  }

  return {
    shouldSwitch: false,
    suggestedAlgorithm: null,
    reason: 'Current algorithm is well-suited to this workload',
    confidence: 'low',
  }
}