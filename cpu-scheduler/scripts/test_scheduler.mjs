import { runScheduler } from '../src/engine/scheduler.js'

const processes = [
  { pid: 1, name: 'P1', arrivalTime: 0, burstTime: 4 },
  { pid: 2, name: 'P2', arrivalTime: 1, burstTime: 3 },
  { pid: 3, name: 'P3', arrivalTime: 2, burstTime: 5 },
]

function printTimeline(title, result) {
  console.log('\n===', title, '===')
  for (const seg of result.timeline) {
    console.log(`${seg.pid === null ? 'idle' : 'P' + seg.pid}[${seg.start}-${seg.end}]`)
  }
  console.log('completionMap:', Object.fromEntries([...result.completionMap.entries()].map(([k,v]) => [k, v])))
}

// FCFS
const fcfs = runScheduler('FCFS', processes)
printTimeline('FCFS', fcfs)

// RR quantum 2
const rr = runScheduler('ROUND_ROBIN', processes, 2)
printTimeline('RR q=2', rr)

// SRTF
const srtf = runScheduler('SRTF', processes)
printTimeline('SRTF', srtf)
