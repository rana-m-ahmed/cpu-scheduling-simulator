/**
 * React hook that exposes computed metrics with formatted display values.
 *
 * @returns {{raw:object,perProcessRows:Array<object>,summary:{avgWaiting:string,avgTurnaround:string,avgResponse:string,cpuUtil:string,throughput:string},completionOrder:Array<string>}|null} Metrics view model or null when unavailable.
 */
import { useMemo } from 'react'
import { useMetricsStore } from '../store/metricsStore.js'
import { useProcessStore } from '../store/processStore.js'
import { getProcessColor } from '../utils/colors.js'

function formatNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(2) : '0.00'
}

export function useMetrics() {
  const metrics = useMetricsStore((state) => state.metrics)
  const processes = useProcessStore((state) => state.processes)

  return useMemo(() => {
    if (!metrics) {
      return null
    }

    const processByPid = new Map(processes.map((process) => [process.pid, process]))

    const perProcessRows = Object.entries(metrics.perProcess).map(([pid, result]) => {
      const process = processByPid.get(Number(pid))

      return {
        pid: Number(pid),
        name: process?.name ?? `P${pid}`,
        arrivalTime: process?.arrivalTime ?? 0,
        burstTime: process?.burstTime ?? 0,
        color: process?.color ?? getProcessColor(pid),
        waitingTime: result.waitingTime,
        turnaroundTime: result.turnaroundTime,
        responseTime: result.responseTime,
        completionTime: result.completionTime,
      }
    })

    const completionOrder = metrics.completionOrder.map((pid) => processByPid.get(pid)?.name ?? `P${pid}`)

    return {
      raw: metrics,
      perProcessRows,
      summary: {
        avgWaiting: formatNumber(metrics.averageWaitingTime),
        avgTurnaround: formatNumber(metrics.averageTurnaroundTime),
        avgResponse: formatNumber(metrics.averageResponseTime),
        cpuUtil: formatNumber(metrics.cpuUtilization),
        throughput: formatNumber(metrics.throughput),
      },
      completionOrder,
    }
  }, [metrics, processes])
}

// Development-time sanity warning for metrics
if (import.meta.env.DEV) {
  const warnIfBad = (m) => {
    if (!m) return
    const checks = [
      ['avgWaiting', m.averageWaitingTime],
      ['avgTurnaround', m.averageTurnaroundTime],
      ['avgResponse', m.averageResponseTime],
      ['cpuUtil', m.cpuUtilization],
      ['throughput', m.throughput],
    ]

    for (const [name, value] of checks) {
      if (!Number.isFinite(Number(value)) || Number(value) < 0) {
        console.warn(`[metrics] Unexpected value for ${name}:`, value)
      }
    }
  }

  // Subscribe to store updates in dev to warn when metrics change
  try {
    const store = useMetricsStore
    store.subscribe((s) => warnIfBad(s.metrics))
  } catch {
    // ignore in production-like environments
  }
}