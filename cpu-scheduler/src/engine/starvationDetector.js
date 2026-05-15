/**
 * Starvation detection helpers for scheduler monitoring.
 */

/**
 * Sum the CPU time consumed by a process up to the current time.
 *
 * @param {Array<{pid:number|null,start:number,end:number}>} timeline - Scheduler timeline.
 * @param {number} pid - Process id to measure.
 * @param {number} currentTime - Current simulation time.
 * @returns {number} Executed time accumulated for the process.
 */
function getExecutedTime(timeline, pid, currentTime) {
  return timeline.reduce((total, entry) => {
    if (entry.pid !== pid) {
      return total
    }

    const entryStart = Math.max(0, entry.start)
    const entryEnd = Math.max(entryStart, Math.min(entry.end, currentTime))

    return total + Math.max(0, entryEnd - entryStart)
  }, 0)
}

/**
 * Detect processes that have waited beyond a starvation threshold.
 *
 * @param {Array<object>} processes - Input process list.
 * @param {Array<{pid:number|null,start:number,end:number}>} timeline - Scheduler timeline.
 * @param {number} currentTime - Current simulation time.
 * @param {number} [threshold=10] - Waiting-time threshold.
 * @returns {Array<{pid:number,waitingTime:number,severity:'warning'|'critical'}>} Starvation alerts.
 */
export function detectStarvation(processes, timeline, currentTime, threshold = 10) {
  const safeProcesses = Array.isArray(processes) ? processes : []
  const safeTimeline = Array.isArray(timeline) ? timeline : []
  const safeCurrentTime = Number.isFinite(Number(currentTime)) ? Number(currentTime) : 0
  const safeThreshold = Math.max(0, Number(threshold) || 0)

  return safeProcesses
    .filter((process) => Number(process?.remainingTime ?? process?.burstTime ?? 0) > 0)
    .map((process) => {
      const arrivalTime = Number(process?.arrivalTime ?? 0)
      const executedTime = getExecutedTime(safeTimeline, Number(process?.pid ?? 0), safeCurrentTime)
      const waitingTime = Math.max(0, safeCurrentTime - (Number.isFinite(arrivalTime) ? arrivalTime : 0) - executedTime)

      return {
        pid: Number(process?.pid ?? 0),
        waitingTime,
        severity: waitingTime >= safeThreshold * 2 ? 'critical' : 'warning',
      }
    })
    .filter((entry) => entry.waitingTime > safeThreshold)
}