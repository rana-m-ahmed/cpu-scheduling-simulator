/**
 * Non-preemptive priority scheduling algorithm.
 */
import {
  appendTimelineSegment,
  cloneProcesses,
  compareByArrivalPid,
  compareByPriorityArrivalPid,
} from './_shared.js'

/**
 * Schedule processes using non-preemptive priority ordering.
 *
 * @param {Array<object>} processes - Input process list.
 * @returns {{timeline: Array<{pid:number|null,start:number,end:number}>, completionMap: Map<number, number>}} Scheduling result.
 */
export function priorityNonPreemptive(processes = []) {
  const sortedProcesses = cloneProcesses(processes).sort(compareByArrivalPid)
  const readyQueue = []
  const timeline = []
  const completionMap = new Map()
  let currentTime = 0
  let index = 0

  while (index < sortedProcesses.length || readyQueue.length > 0) {
    while (index < sortedProcesses.length && sortedProcesses[index].arrivalTime <= currentTime) {
      readyQueue.push(sortedProcesses[index])
      index += 1
    }

    if (readyQueue.length === 0) {
      const nextArrival = sortedProcesses[index]?.arrivalTime

      if (Number.isFinite(nextArrival) && currentTime < nextArrival) {
        appendTimelineSegment(timeline, null, currentTime, nextArrival)
        currentTime = nextArrival
      }

      continue
    }

    readyQueue.sort(compareByPriorityArrivalPid)
    const process = readyQueue.shift()
    const start = currentTime
    const end = start + process.burstTime

    appendTimelineSegment(timeline, process.pid, start, end)
    currentTime = end
    completionMap.set(process.pid, currentTime)
  }

  return { timeline, completionMap }
}