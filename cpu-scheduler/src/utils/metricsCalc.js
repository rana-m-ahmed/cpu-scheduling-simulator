/**
 * Pure metrics calculator for CPU scheduling simulation results.
 */

/**
 * Compute scheduling metrics from a timeline and a process list.
 *
 * @param {Array<{pid:number|null,start:number,end:number}>} timeline - Simulation timeline.
 * @param {Array<object>} processes - Process list used for the simulation.
 * @returns {{perProcess: Record<number, {waitingTime:number, turnaroundTime:number, responseTime:number, completionTime:number}>, averageWaitingTime:number, averageTurnaroundTime:number, averageResponseTime:number, cpuUtilization:number, throughput:number, completionOrder:number[]}} Metrics result.
 */
export function computeMetrics(timeline, processes) {
  const safeTimeline = Array.isArray(timeline) ? timeline : []
  const safeProcesses = Array.isArray(processes) ? processes : []

  if (safeProcesses.length === 0) {
    return {
      perProcess: {},
      averageWaitingTime: 0,
      averageTurnaroundTime: 0,
      averageResponseTime: 0,
      cpuUtilization: 0,
      throughput: 0,
      completionOrder: [],
    }
  }

  const perProcess = {}
  const completionOrder = []
  const firstStartMap = new Map()
  const completionMap = new Map()
  let nonIdleTime = 0
  let totalTime = 0

  for (const entry of safeTimeline) {
    const entryStart = Number(entry?.start ?? 0)
    const entryEnd = Number(entry?.end ?? 0)

    if (!Number.isFinite(entryStart) || !Number.isFinite(entryEnd) || entryEnd <= entryStart) {
      continue
    }

    totalTime = Math.max(totalTime, entryEnd)

    if (entry.pid !== null) {
      nonIdleTime += entryEnd - entryStart

      if (!firstStartMap.has(entry.pid)) {
        firstStartMap.set(entry.pid, entryStart)
      }

      completionMap.set(entry.pid, entryEnd)
    }
  }

  const orderedCompletionEntries = Array.from(completionMap.entries()).sort((left, right) => {
    if (left[1] !== right[1]) {
      return left[1] - right[1]
    }

    return left[0] - right[0]
  })

  for (const [pid] of orderedCompletionEntries) {
    completionOrder.push(pid)
  }

  let totalWaitingTime = 0
  let totalTurnaroundTime = 0
  let totalResponseTime = 0

  for (const process of safeProcesses) {
    const pid = Number(process?.pid ?? 0)
    const arrivalTime = Number(process?.arrivalTime ?? 0)
    const burstTime = Number(process?.burstTime ?? 0)
    const completionTime = completionMap.get(pid) ?? arrivalTime
    const firstStartTime = firstStartMap.get(pid) ?? completionTime
    const turnaroundTime = Math.max(0, completionTime - arrivalTime)
    const waitingTime = Math.max(0, turnaroundTime - Math.max(0, burstTime))
    const responseTime = Math.max(0, firstStartTime - arrivalTime)

    perProcess[pid] = {
      waitingTime,
      turnaroundTime,
      responseTime,
      completionTime,
    }

    totalWaitingTime += waitingTime
    totalTurnaroundTime += turnaroundTime
    totalResponseTime += responseTime
  }

  const processCount = safeProcesses.length

  return {
    perProcess,
    averageWaitingTime: totalWaitingTime / processCount,
    averageTurnaroundTime: totalTurnaroundTime / processCount,
    averageResponseTime: totalResponseTime / processCount,
    cpuUtilization: totalTime > 0 ? (nonIdleTime / totalTime) * 100 : 0,
    // Throughput: processes per unit time (use total processes / total time)
    throughput: totalTime > 0 ? processCount / totalTime : 0,
    completionOrder,
  }
}