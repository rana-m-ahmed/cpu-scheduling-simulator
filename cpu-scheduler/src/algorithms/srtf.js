/**
 * Preemptive Shortest Remaining Time First scheduling algorithm.
 */
import {
  appendTimelineSegment,
  cloneProcesses,
  compareByArrivalPid,
  compareByRemainingArrivalPid,
} from './_shared.js'

/**
 * Schedule processes using SRTF.
 *
 * @param {Array<object>} processes - Input process list.
 * @returns {{timeline: Array<{pid:number|null,start:number,end:number}>, completionMap: Map<number, number>}} Scheduling result.
 */
export function srtf(processes = []) {
  const sortedProcesses = cloneProcesses(processes).sort(compareByArrivalPid)
  const readyQueue = []
  const timeline = []
  const completionMap = new Map()
  let currentTime = 0
  let index = 0

  while (index < sortedProcesses.length || readyQueue.length > 0) {
    while (index < sortedProcesses.length && sortedProcesses[index].arrivalTime <= currentTime) {
      const process = sortedProcesses[index]

      if (process.remainingTime <= 0) {
        completionMap.set(process.pid, process.arrivalTime)
      } else {
        readyQueue.push(process)
      }

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

    readyQueue.sort(compareByRemainingArrivalPid)
    const currentProcess = readyQueue.shift()

    appendTimelineSegment(timeline, currentProcess.pid, currentTime, currentTime + 1)
    currentProcess.remainingTime -= 1
    currentTime += 1

    if (currentProcess.remainingTime <= 0) {
      completionMap.set(currentProcess.pid, currentTime)
    } else {
      readyQueue.push(currentProcess)
    }
  }

  return { timeline, completionMap }
}