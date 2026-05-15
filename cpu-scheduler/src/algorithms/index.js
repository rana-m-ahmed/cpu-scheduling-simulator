/**
 * Algorithm registry and dispatcher for the scheduling engine.
 */
import { fcfs } from './fcfs.js'
import { mlfq } from './mlfq.js'
import { priorityNonPreemptive } from './priority.js'
import { priorityPreemptive } from './priorityPreemptive.js'
import { roundRobin } from './roundRobin.js'
import { sjf } from './sjf.js'
import { srtf } from './srtf.js'

export { fcfs, mlfq, priorityNonPreemptive, priorityPreemptive, roundRobin, sjf, srtf }

/**
 * Dispatch to a scheduling algorithm by registry id.
 *
 * @param {string} algorithmId - Algorithm id from the registry.
 * @param {Array<object>} processes - Input process list.
 * @param {unknown} [options] - Algorithm-specific options.
 * @returns {{timeline: Array<{pid:number|null,start:number,end:number}>, completionMap: Map<number, number>}} Scheduling result.
 */
export function algorithmRunner(algorithmId, processes, options) {
  switch (algorithmId) {
    case 'FCFS':
      return fcfs(processes)
    case 'SJF':
      return sjf(processes)
    case 'SRTF':
      return srtf(processes)
    case 'PRIORITY':
      return priorityNonPreemptive(processes)
    case 'PRIORITY_PREEMPTIVE':
      return priorityPreemptive(processes)
    case 'ROUND_ROBIN':
      return roundRobin(processes, typeof options === 'number' ? options : options?.quantum)
    case 'MLFQ':
      return mlfq(processes, options)
    default:
      throw new Error(`Unknown scheduling algorithm: ${algorithmId}`)
  }
}