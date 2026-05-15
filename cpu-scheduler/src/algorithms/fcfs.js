/**
 * First Come, First Served scheduling algorithm.
 */
import { appendTimelineSegment, cloneProcesses, compareByArrivalPid, getBurstDuration } from './_shared.js'

/**
 * Schedule processes using FCFS order.
 *
 * @param {Array<object>} processes - Input process list.
 * @returns {{timeline: Array<{pid:number|null,start:number,end:number}>, completionMap: Map<number, number>}} Scheduling result.
 */
export function fcfs(processes = []) {
  const sortedProcesses = cloneProcesses(processes).sort(compareByArrivalPid)
  const timeline = []
  const completionMap = new Map()
  let currentTime = 0

  for (const process of sortedProcesses) {
    const arrivalTime = process.arrivalTime
    const burstTime = getBurstDuration(process)

    if (currentTime < arrivalTime) {
      appendTimelineSegment(timeline, null, currentTime, arrivalTime)
      currentTime = arrivalTime
    }

    const start = currentTime
    const end = start + burstTime

    appendTimelineSegment(timeline, process.pid, start, end)
    currentTime = end
    completionMap.set(process.pid, currentTime)
  }

  return { timeline, completionMap }
}