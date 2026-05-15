/**
 * Classic round robin scheduling algorithm.
 */
import { appendTimelineSegment, cloneProcesses, compareByArrivalPid } from './_shared.js'

/**
 * Schedule processes using round robin with a fixed quantum.
 *
 * @param {Array<object>} processes - Input process list.
 * @param {number} [quantum=2] - Time quantum.
 * @returns {{timeline: Array<{pid:number|null,start:number,end:number}>, completionMap: Map<number, number>}} Scheduling result.
 */
export function roundRobin(processes = [], quantum = 2) {
  const sortedProcesses = cloneProcesses(processes).sort(compareByArrivalPid)
  const readyQueue = []
  const timeline = []
  const completionMap = new Map()
  const fixedQuantum = Math.max(1, Number(quantum) || 2)
  let currentTime = 0
  let index = 0
  let activeProcess = null
  let sliceRemaining = 0

  while (index < sortedProcesses.length || readyQueue.length > 0 || activeProcess) {
    while (index < sortedProcesses.length && sortedProcesses[index].arrivalTime <= currentTime) {
      const process = sortedProcesses[index]

      if (process.remainingTime <= 0) {
        completionMap.set(process.pid, process.arrivalTime)
      } else {
        readyQueue.push(process)
      }

      index += 1
    }

    if (!activeProcess) {
      if (readyQueue.length === 0) {
        const nextArrival = sortedProcesses[index]?.arrivalTime

        if (Number.isFinite(nextArrival) && currentTime < nextArrival) {
          appendTimelineSegment(timeline, null, currentTime, nextArrival)
          currentTime = nextArrival
        }

        continue
      }

      activeProcess = readyQueue.shift()
      sliceRemaining = fixedQuantum
    }

    appendTimelineSegment(timeline, activeProcess.pid, currentTime, currentTime + 1)
    activeProcess.remainingTime -= 1
    sliceRemaining -= 1
    currentTime += 1

    if (activeProcess.remainingTime <= 0) {
      completionMap.set(activeProcess.pid, currentTime)
      activeProcess = null
      sliceRemaining = 0
      continue
    }

    if (sliceRemaining <= 0) {
      readyQueue.push(activeProcess)
      activeProcess = null
    }
  }

  return { timeline, completionMap }
}