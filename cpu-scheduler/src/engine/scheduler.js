/**
 * Scheduler engine entry point.
 */
import { algorithmRunner } from '../algorithms/index.js'

/**
 * Deep-clone a list of processes without mutating the original input.
 *
 * @param {Array<object>} processes - Input process list.
 * @returns {Array<object>} Deep-cloned process list.
 */
function cloneProcessesForScheduling(processes = []) {
  const source = Array.isArray(processes) ? processes : []

  return source.map((process) => ({ ...process }))
}

/**
 * Run a scheduling algorithm against the provided process snapshot.
 *
 * @param {string} algorithmId - Algorithm id from the registry.
 * @param {Array<object>} processes - Input process list.
 * @param {unknown} [options] - Algorithm-specific options.
 * @returns {{timeline: Array<{pid:number|null,start:number,end:number}>, completionMap: Map<number, number>, totalTime: number}} Scheduling result.
 */
export function runScheduler(algorithmId, processes = [], options) {
  const clonedProcesses = cloneProcessesForScheduling(processes)
  const { timeline, completionMap } = algorithmRunner(algorithmId, clonedProcesses, options)
  const totalTime = timeline.length > 0 ? timeline[timeline.length - 1].end : 0

  return { timeline, completionMap, totalTime }
}