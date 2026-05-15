/**
 * Multi-Level Feedback Queue scheduling algorithm.
 */
import { appendTimelineSegment, cloneProcesses, compareByArrivalPid } from './_shared.js'

function getQuantumForLevel(level, quantums) {
  const value = quantums[level] ?? quantums[quantums.length - 1] ?? 1

  return Math.max(1, Number(value) || 1)
}

function hasHigherPriorityWork(queues, level) {
  for (let queueLevel = 0; queueLevel < level; queueLevel += 1) {
    if (queues[queueLevel].length > 0) {
      return true
    }
  }

  return false
}

function takeHighestPriorityProcess(queues) {
  for (let level = 0; level < queues.length; level += 1) {
    if (queues[level].length > 0) {
      return queues[level].shift()
    }
  }

  return null
}

/**
 * Schedule processes using a configurable MLFQ.
 *
 * @param {Array<object>} processes - Input process list.
 * @param {{levels?: number, quantums?: Array<number>}} [options={ levels: 3, quantums: [2, 4, 8] }] - Queue configuration.
 * @returns {{timeline: Array<{pid:number|null,start:number,end:number}>, completionMap: Map<number, number>}} Scheduling result.
 */
export function mlfq(processes = [], options = { levels: 3, quantums: [2, 4, 8] }) {
  const sortedProcesses = cloneProcesses(processes).sort(compareByArrivalPid)
  const normalizedLevels = Math.max(1, Number(options?.levels ?? 3) || 3)
  const quantums = Array.isArray(options?.quantums) && options.quantums.length > 0
    ? options.quantums
    : [2, 4, 8]
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

    if (!activeProcess) {
      activeProcess = takeHighestPriorityProcess(queues)
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
      activeProcess.usedQuantum = (activeProcess.usedQuantum ?? 0) + 1

      if (activeProcess.usedQuantum >= getQuantumForLevel(level, quantums)) {
        activeProcess.queueLevel = level + 1
        activeProcess.usedQuantum = 0
        queues[activeProcess.queueLevel].push(activeProcess)
        activeProcess = null
      }
    }
  }

  return { timeline, completionMap }
}