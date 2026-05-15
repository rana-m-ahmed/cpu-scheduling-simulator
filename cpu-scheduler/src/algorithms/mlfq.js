/**
 * Multi-Level Feedback Queue scheduling algorithm.
 */
import {
  appendTimelineSegment,
  cloneProcesses,
  compareByArrivalPid,
  compareByBurstArrivalPid,
  compareByRemainingArrivalPid,
} from './_shared.js'

const DEFAULT_LEVEL_ALGORITHM = 'ROUND_ROBIN'
const ALLOWED_LEVEL_ALGORITHMS = new Set(['FCFS', 'SJF', 'SRTF', 'ROUND_ROBIN'])

function getQuantumForLevel(level, quantums) {
  const value = quantums[level] ?? quantums[quantums.length - 1] ?? 1

  return Math.max(1, Number(value) || 1)
}

function normalizeLevelAlgorithm(algorithm, fallback = DEFAULT_LEVEL_ALGORITHM) {
  const normalized = String(algorithm ?? '').toUpperCase()

  return ALLOWED_LEVEL_ALGORITHMS.has(normalized) ? normalized : fallback
}

function getLevelAlgorithm(level, algorithms) {
  const fallbackAlgorithm = algorithms[algorithms.length - 1] ?? DEFAULT_LEVEL_ALGORITHM

  return normalizeLevelAlgorithm(algorithms[level], normalizeLevelAlgorithm(fallbackAlgorithm))
}

function hasHigherPriorityWork(queues, level) {
  for (let queueLevel = 0; queueLevel < level; queueLevel += 1) {
    if (queues[queueLevel].length > 0) {
      return true
    }
  }

  return false
}

function getLevelComparator(levelAlgorithm) {
  switch (levelAlgorithm) {
    case 'SJF':
      return compareByBurstArrivalPid
    case 'SRTF':
      return compareByRemainingArrivalPid
    default:
      return compareByArrivalPid
  }
}

function selectFromLevelQueue(queue, levelAlgorithm) {
  if (queue.length === 0) {
    return null
  }

  if (levelAlgorithm === 'SJF' || levelAlgorithm === 'SRTF') {
    queue.sort(getLevelComparator(levelAlgorithm))
  }

  return queue.shift()
}

function shouldPreemptAtSameLevel(activeProcess, queue, levelAlgorithm) {
  if (!activeProcess || levelAlgorithm !== 'SRTF' || queue.length === 0) {
    return false
  }

  const bestCandidate = [...queue].sort(getLevelComparator(levelAlgorithm))[0]

  return compareByRemainingArrivalPid(bestCandidate, activeProcess) < 0
}

/**
 * Schedule processes using a configurable MLFQ.
 *
 * @param {Array<object>} processes - Input process list.
 * @param {{levels?: number, quantums?: Array<number>, levelAlgorithms?: Array<string>, policies?: Array<string>, algorithms?: Array<string>}} [options={ levels: 3, quantums: [2, 4, 8], levelAlgorithms: ['ROUND_ROBIN', 'ROUND_ROBIN', 'ROUND_ROBIN'] }] - Queue configuration.
 * @returns {{timeline: Array<{pid:number|null,start:number,end:number}>, completionMap: Map<number, number>}} Scheduling result.
 */
export function mlfq(processes = [], options = { levels: 3, quantums: [2, 4, 8], levelAlgorithms: ['ROUND_ROBIN', 'ROUND_ROBIN', 'ROUND_ROBIN'] }) {
  const sortedProcesses = cloneProcesses(processes).sort(compareByArrivalPid)
  const normalizedLevels = Math.max(1, Number(options?.levels ?? 3) || 3)
  const quantums = Array.isArray(options?.quantums) && options.quantums.length > 0
    ? options.quantums
    : [2, 4, 8]
  const levelAlgorithms = Array.isArray(options?.levelAlgorithms) && options.levelAlgorithms.length > 0
    ? options.levelAlgorithms
    : Array.isArray(options?.policies) && options.policies.length > 0
      ? options.policies
      : Array.isArray(options?.algorithms) && options.algorithms.length > 0
        ? options.algorithms
        : ['ROUND_ROBIN', 'ROUND_ROBIN', 'ROUND_ROBIN']
  const queues = Array.from({ length: normalizedLevels }, () => [])
  const timeline = []
  const completionMap = new Map()
  let currentTime = 0
  let index = 0
  let activeProcess = null

  while (index < sortedProcesses.length || queues.some((queue) => queue.length > 0) || activeProcess) {
    while (index < sortedProcesses.length && sortedProcesses[index].arrivalTime <= currentTime) {
      const process = sortedProcesses[index]

      if (process.remainingTime <= 0) {
        completionMap.set(process.pid, process.arrivalTime)
      } else {
        process.queueLevel = 0
        process.usedQuantum = 0
        queues[0].push(process)
      }

      index += 1
    }

    if (activeProcess && hasHigherPriorityWork(queues, activeProcess.queueLevel)) {
      queues[activeProcess.queueLevel].unshift(activeProcess)
      activeProcess = null
    }

    if (activeProcess) {
      const activeLevel = Math.max(0, Math.min(activeProcess.queueLevel ?? 0, normalizedLevels - 1))
      const activeLevelAlgorithm = getLevelAlgorithm(activeLevel, levelAlgorithms)

      if (shouldPreemptAtSameLevel(activeProcess, queues[activeLevel], activeLevelAlgorithm)) {
        queues[activeLevel].unshift(activeProcess)
        activeProcess = null
      }
    }

    if (!activeProcess) {
      for (let level = 0; level < queues.length; level += 1) {
        const levelAlgorithm = getLevelAlgorithm(level, levelAlgorithms)
        const candidate = selectFromLevelQueue(queues[level], levelAlgorithm)

        if (candidate) {
          activeProcess = candidate
          break
        }
      }
    }

    if (!activeProcess) {
      const nextArrival = sortedProcesses[index]?.arrivalTime

      if (Number.isFinite(nextArrival) && currentTime < nextArrival) {
        appendTimelineSegment(timeline, null, currentTime, nextArrival)
        currentTime = nextArrival
      }

      continue
    }

    const level = Math.max(0, Math.min(activeProcess.queueLevel ?? 0, normalizedLevels - 1))

    appendTimelineSegment(timeline, activeProcess.pid, currentTime, currentTime + 1)
    activeProcess.remainingTime -= 1
    currentTime += 1

    if (activeProcess.remainingTime <= 0) {
      completionMap.set(activeProcess.pid, currentTime)
      activeProcess = null
      continue
    }

    if (level < normalizedLevels - 1) {
      const levelAlgorithm = getLevelAlgorithm(level, levelAlgorithms)

      if (levelAlgorithm === 'ROUND_ROBIN') {
        activeProcess.usedQuantum = (activeProcess.usedQuantum ?? 0) + 1

        if (activeProcess.usedQuantum >= getQuantumForLevel(level, quantums)) {
          activeProcess.queueLevel = level + 1
          activeProcess.usedQuantum = 0
          queues[activeProcess.queueLevel].push(activeProcess)
          activeProcess = null
          continue
        }
      }
    }
  }

  return { timeline, completionMap }
}