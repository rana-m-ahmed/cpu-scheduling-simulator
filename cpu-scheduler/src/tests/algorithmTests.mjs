import { fcfs } from '../algorithms/fcfs.js'
import { sjf } from '../algorithms/sjf.js'
import { srtf } from '../algorithms/srtf.js'
import { roundRobin } from '../algorithms/roundRobin.js'
import { mlfq } from '../algorithms/mlfq.js'

function assertEqual(a, b, message) {
  const ok = JSON.stringify(a) === JSON.stringify(b)
  console.log(message || '', ok ? 'PASS' : 'FAIL')
  if (!ok) {
    console.log('Expected:', JSON.stringify(b))
    console.log('Actual:  ', JSON.stringify(a))
  }
}

console.log('Running Algorithm Tests...')

// TEST SUITE A — FCFS
const processesA = [
  { pid:1, name:'P1', arrivalTime:0, burstTime:4, remainingTime:4, priority:1 },
  { pid:2, name:'P2', arrivalTime:1, burstTime:3, remainingTime:3, priority:2 },
  { pid:3, name:'P3', arrivalTime:2, burstTime:5, remainingTime:5, priority:3 },
]
const expectedTimelineA = [{pid:1,start:0,end:4},{pid:2,start:4,end:7},{pid:3,start:7,end:12}]
const expectedCompletionA = {1:4,2:7,3:12}
const resA = fcfs(processesA)
console.log('\nTEST A — FCFS')
assertEqual(resA.timeline, expectedTimelineA, 'Timeline')
assertEqual(Object.fromEntries(resA.completionMap), expectedCompletionA, 'CompletionMap')

// TEST SUITE B — SJF
const resB = sjf(processesA)
console.log('\nTEST B — SJF (non-preemptive)')
assertEqual(resB.timeline, expectedTimelineA, 'Timeline (should match FCFS)')
assertEqual(Object.fromEntries(resB.completionMap), expectedCompletionA, 'CompletionMap')

// TEST SUITE C — SRTF
const processesC = [
  { pid:1, name:'P1', arrivalTime:0, burstTime:8, remainingTime:8, priority:1 },
  { pid:2, name:'P2', arrivalTime:1, burstTime:4, remainingTime:4, priority:2 },
  { pid:3, name:'P3', arrivalTime:2, burstTime:9, remainingTime:9, priority:3 },
  { pid:4, name:'P4', arrivalTime:3, burstTime:5, remainingTime:5, priority:4 },
]
const expectedTimelineC = [
  {pid:1,start:0,end:1},
  {pid:2,start:1,end:5},
  {pid:4,start:5,end:10},
  {pid:1,start:10,end:17},
  {pid:3,start:17,end:26},
]
const originalC = JSON.parse(JSON.stringify(processesC))
const resC = srtf(processesC)
console.log('\nTEST C — SRTF')
assertEqual(resC.timeline, expectedTimelineC, 'Timeline')
console.log('Deep copy immutability check:')
assertEqual(processesC, originalC, 'Original processes unchanged')

// TEST SUITE D — Round Robin (quantum=2)
const processesD = [
  { pid:1, name:'P1', arrivalTime:0, burstTime:5, remainingTime:5, priority:1 },
  { pid:2, name:'P2', arrivalTime:0, burstTime:3, remainingTime:3, priority:2 },
  { pid:3, name:'P3', arrivalTime:0, burstTime:1, remainingTime:1, priority:3 },
]
const expectedTimelineD = [
  {pid:1,start:0,end:2},
  {pid:2,start:2,end:4},
  {pid:3,start:4,end:5},
  {pid:1,start:5,end:7},
  {pid:2,start:7,end:8},
  {pid:1,start:8,end:9},
]
const resD = roundRobin(processesD, 2)
console.log('\nTEST D — Round Robin')
assertEqual(resD.timeline, expectedTimelineD, 'Timeline')

// TEST SUITE E — MLFQ
const processesE = [
  { pid:1, name:'P1', arrivalTime:0, burstTime:10, remainingTime:10, priority:1 },
  { pid:2, name:'P2', arrivalTime:0, burstTime:4, remainingTime:4, priority:2 },
  { pid:3, name:'P3', arrivalTime:0, burstTime:2, remainingTime:2, priority:3 },
]
console.log('\nTEST E — MLFQ')
const resE = mlfq(processesE, { levels:3, quantums:[2,4,8] })
console.log('Timeline length:', resE.timeline.length)
console.log('CompletionMap:', Object.fromEntries(resE.completionMap))

console.log('\nTEST F — MLFQ mixed per-level policies')
const processesF = [
  { pid:1, name:'P1', arrivalTime:0, burstTime:4, remainingTime:4, priority:1 },
  { pid:2, name:'P2', arrivalTime:0, burstTime:2, remainingTime:2, priority:2 },
  { pid:3, name:'P3', arrivalTime:0, burstTime:1, remainingTime:1, priority:3 },
]
const resF = mlfq(processesF, { levels:2, quantums:[1,2], levelAlgorithms:['SJF', 'FCFS'] })
const expectedTimelineF = [
  { pid:3, start:0, end:1 },
  { pid:2, start:1, end:3 },
  { pid:1, start:3, end:7 },
]
assertEqual(resF.timeline, expectedTimelineF, 'SJF-level runs to completion, no quantum-based demotion')

console.log('\nTEST G — MLFQ FCFS-level bypasses quantum')
const processesG = [
  { pid:1, name:'P1', arrivalTime:0, burstTime:10, remainingTime:10, priority:1 },
  { pid:2, name:'P2', arrivalTime:0, burstTime:5, remainingTime:5, priority:2 },
]
const resG = mlfq(processesG, { levels:2, quantums:[2,4], levelAlgorithms:['FCFS', 'FCFS'] })
const expectedTimelineG = [
  { pid:1, start:0, end:10 },
  { pid:2, start:10, end:15 },
]
assertEqual(resG.timeline, expectedTimelineG, 'FCFS respects no quantum, runs to completion at level')

console.log('\nAlgorithm Tests Complete')
