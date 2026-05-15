import useProcessStore from '../store/processStore.js'
import useSimulationStore from '../store/simulationStore.js'
import useMetricsStore from '../store/metricsStore.js'

function log(title, ok) {
  console.log(title, ok ? 'PASS' : 'FAIL')
}

console.log('Running Store Tests...')

// Debug import
console.log('useProcessStore type:', typeof useProcessStore)
console.log('useProcessStore keys:', useProcessStore ? Object.keys(useProcessStore) : null)

// Inspect underlying state
console.log('useProcessStore.getState():', useProcessStore.getState())

// Reset stores
useProcessStore.getState().clearProcesses()
useSimulationStore.getState().resetSimulation()
useMetricsStore.getState().metrics = null

// TEST 2.1 — processStore: Add Process
useProcessStore.getState().addProcess({ name:'P1', arrivalTime:0, burstTime:4, priority:1, type:'cpu' })
const processes = useProcessStore.getState().processes
const nextPid = useProcessStore.getState().nextPid
console.log('\nTEST 2.1 — processStore: Add Process')
log('process count === 1', processes.length === 1)
log('pid === 1', processes[0].pid === 1)
log('remainingTime === burstTime', processes[0].remainingTime === processes[0].burstTime)
log('color defined', typeof processes[0].color === 'string' && processes[0].color.startsWith('#'))
log('nextPid === 2', nextPid === 2)

// TEST 2.2 — processStore: Update Process
useProcessStore.getState().updateProcess(1, { burstTime: 8 })
const p = useProcessStore.getState().processes.find(x => x.pid === 1)
console.log('\nTEST 2.2 — Update Process')
log('burstTime == 8', p.burstTime === 8)
log('remainingTime == 8', p.remainingTime === 8)

// TEST 2.3 — Remove Process
useProcessStore.getState().removeProcess(1)
console.log('\nTEST 2.3 — Remove Process')
log('processes empty', useProcessStore.getState().processes.length === 0)

// TEST 2.4 — simulationStore: Algorithm Switch
useSimulationStore.getState().setAlgorithm('ROUND_ROBIN')
const sim = useSimulationStore.getState()
console.log('\nTEST 2.4 — setAlgorithm')
log('algorithmId === ROUND_ROBIN', sim.algorithmId === 'ROUND_ROBIN')
log('status === idle', sim.status === 'idle')

// TEST 2.4b — MLFQ level normalization
useSimulationStore.getState().setAlgorithm('MLFQ')
useSimulationStore.getState().updateParameter('mlfqLevels', 4)
useSimulationStore.getState().updateParameter('mlfqQuantums', [1, 2])
useSimulationStore.getState().updateParameter('mlfqLevelAlgorithms', ['SJF', 'FCFS'])
const mlfqParams = useSimulationStore.getState().parameters
console.log('\nTEST 2.4b — MLFQ normalization')
log('mlfqLevels === 4', mlfqParams.mlfqLevels === 4)
log('quantums aligned with levels', mlfqParams.mlfqQuantums.length === 4)
log('algorithms aligned with levels', mlfqParams.mlfqLevelAlgorithms.length === 4)
log('existing quantum preserved', mlfqParams.mlfqQuantums[0] === 1)
log('existing algorithm preserved', mlfqParams.mlfqLevelAlgorithms[0] === 'SJF')
log('new level quantum has fallback', Number.isFinite(mlfqParams.mlfqQuantums[3]))
log('new level algorithm defaults safely', typeof mlfqParams.mlfqLevelAlgorithms[3] === 'string')

// Prepare processes for startSimulation
useProcessStore.getState().clearProcesses()
useProcessStore.getState().addProcess({ name:'P1', arrivalTime:0, burstTime:2 })
useProcessStore.getState().addProcess({ name:'P2', arrivalTime:1, burstTime:2 })
useProcessStore.getState().addProcess({ name:'P3', arrivalTime:2, burstTime:2 })
const procs = useProcessStore.getState().processes

// TEST 2.5 — startSimulation
useSimulationStore.getState().startSimulation(procs)
const sim2 = useSimulationStore.getState()
console.log('\nTEST 2.5 — startSimulation')
log('timeline not empty', Array.isArray(sim2.timeline) && sim2.timeline.length > 0)
log('status === running', sim2.status === 'running')
log('currentTime === 0', sim2.currentTime === 0)
log('playbackIndex === 0', sim2.playbackIndex === 0)

// TEST 2.6 — tick
useSimulationStore.getState().tick()
const sim3 = useSimulationStore.getState()
console.log('\nTEST 2.6 — tick')
log('playbackIndex === 1', sim3.playbackIndex === 1)
log('currentTime > 0', sim3.currentTime >= 0)

// Fast-forward to end
while (useSimulationStore.getState().status === 'running') {
  useSimulationStore.getState().tick()
  // prevent infinite loop
  if (useSimulationStore.getState().playbackIndex > 1000) break
}
console.log('Final status:', useSimulationStore.getState().status)
log('status === completed', useSimulationStore.getState().status === 'completed')

// TEST 2.7 — metricsStore: computeAndStore
useMetricsStore.getState().computeAndStore(useSimulationStore.getState().timeline, useProcessStore.getState().processes)
const metrics = useMetricsStore.getState().metrics
console.log('\nTEST 2.7 — metricsStore computeAndStore')
log('metrics not null', metrics !== null)
log('averageWaitingTime is finite', Number.isFinite(metrics?.averageWaitingTime))
log('cpuUtilization in 0..100', metrics?.cpuUtilization >= 0 && metrics?.cpuUtilization <= 100)
log('perProcess entries >= 1', metrics && Object.keys(metrics.perProcess).length >= 1)

console.log('\nStore Tests Complete')
