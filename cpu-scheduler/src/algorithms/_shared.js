/**
 * Shared pure helpers for CPU scheduling algorithms.
 */

/**
 * Clone process records and normalize numeric fields for deterministic scheduling.
 *
 * @param {Array<object>} processes - Input process list.
 * @returns {Array<object>} Deep-cloned process list with normalized numeric fields.
 */
export function cloneProcesses(processes = []) {
  const source = Array.isArray(processes) ? processes : []

  return source.map((process) => {
    const arrivalTime = Number(process?.arrivalTime ?? 0)
    const burstTime = Number(process?.burstTime ?? 0)
    const remainingTimeRaw = Number(process?.remainingTime)
    const priority = Number(process?.priority ?? 0)
    const pid = Number(process?.pid ?? 0)

    return {
      ...process,
      pid: Number.isFinite(pid) ? pid : 0,
      arrivalTime: Number.isFinite(arrivalTime) ? arrivalTime : 0,
      burstTime: Number.isFinite(burstTime) ? burstTime : 0,
      remainingTime: Number.isFinite(remainingTimeRaw)
        ? Math.max(0, remainingTimeRaw)
        : Number.isFinite(burstTime)
          ? Math.max(0, burstTime)
          : 0,
      priority: Number.isFinite(priority) ? priority : 0,
    }
  })
}

/**
 * Compare by arrival time, then pid.
 *
 * @param {object} left - Left process.
 * @param {object} right - Right process.
 * @returns {number} Ordering result.
 */
export function compareByArrivalPid(left, right) {
  return left.arrivalTime - right.arrivalTime || left.pid - right.pid
}

/**
 * Compare by burst time, then arrival time, then pid.
 *
 * @param {object} left - Left process.
 * @param {object} right - Right process.
 * @returns {number} Ordering result.
 */
export function compareByBurstArrivalPid(left, right) {
  return (
    left.burstTime - right.burstTime || left.arrivalTime - right.arrivalTime || left.pid - right.pid
  )
}

/**
 * Compare by remaining time, then arrival time, then pid.
 *
 * @param {object} left - Left process.
 * @param {object} right - Right process.
 * @returns {number} Ordering result.
 */
export function compareByRemainingArrivalPid(left, right) {
  return (
    left.remainingTime - right.remainingTime ||
    left.arrivalTime - right.arrivalTime ||
    left.pid - right.pid
  )
}

/**
 * Compare by priority, then arrival time, then pid.
 *
 * @param {object} left - Left process.
 * @param {object} right - Right process.
 * @returns {number} Ordering result.
 */
export function compareByPriorityArrivalPid(left, right) {
  return left.priority - right.priority || left.arrivalTime - right.arrivalTime || left.pid - right.pid
}

/**
 * Append a timeline segment while merging adjacent segments with the same pid.
 *
 * @param {Array<{pid:number|null,start:number,end:number}>} timeline - Timeline to update.
 * @param {number|null} pid - Process id or null for idle.
 * @param {number} start - Segment start time.
 * @param {number} end - Segment end time.
 * @returns {void}
 */
export function appendTimelineSegment(timeline, pid, start, end) {
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return
  }

  const lastEntry = timeline[timeline.length - 1]

  if (lastEntry && lastEntry.pid === pid && lastEntry.end === start) {
    lastEntry.end = end
    return
  }

  timeline.push({ pid, start, end })
}

/**
 * Read a non-negative burst duration from a process.
 *
 * @param {object} process - Process record.
 * @returns {number} Burst duration.
 */
export function getBurstDuration(process) {
  const burstTime = Number(process?.burstTime ?? 0)

  return Number.isFinite(burstTime) ? Math.max(0, burstTime) : 0
}

/**
 * Read a non-negative remaining duration from a process.
 *
 * @param {object} process - Process record.
 * @returns {number} Remaining duration.
 */
export function getRemainingDuration(process) {
  const remainingTime = Number(process?.remainingTime)

  if (Number.isFinite(remainingTime)) {
    return Math.max(0, remainingTime)
  }

  return getBurstDuration(process)
}

/**
 * Find the next arrival time after the current cursor.
 *
 * @param {Array<object>} processes - Sorted process list.
 * @param {number} index - Current list index.
 * @returns {number|null} Next arrival time or null.
 */
export function getNextArrivalTime(processes, index) {
  return index < processes.length ? processes[index].arrivalTime : null
}