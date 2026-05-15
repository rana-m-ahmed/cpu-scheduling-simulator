/**
 * Zustand store for the master process list.
 */
import { create } from 'zustand'
import { getProcessColor } from '../utils/colors.js'

function normalizeProcessInput(partial = {}) {
  const pid = Number(partial.pid ?? 0)
  const arrivalTime = Number(partial.arrivalTime ?? 0)
  const burstTime = Number(partial.burstTime ?? 0)
  const remainingTime = Number(partial.remainingTime ?? burstTime)
  const priority = Number(partial.priority ?? 0)

  return {
    pid,
    name: String(partial.name ?? `P${pid || 1}`),
    arrivalTime: Number.isFinite(arrivalTime) ? arrivalTime : 0,
    burstTime: Number.isFinite(burstTime) ? burstTime : 0,
    remainingTime: Number.isFinite(remainingTime) ? remainingTime : 0,
    priority: Number.isFinite(priority) ? priority : 0,
    color: String(partial.color ?? getProcessColor(pid)),
    type: partial.type === 'io' ? 'io' : 'cpu',
  }
}

/**
 * Add a new process with deterministic defaults.
 *
 * @param {object} partial - Partial process payload.
 * @returns {void}
 */
function addProcessHelper(partial = {}) {
  return normalizeProcessInput(partial)
}

/**
 * Create a fresh process store snapshot.
 *
 * @returns {{processes:Array<object>,nextPid:number,addProcess:function,updateProcess:function,removeProcess:function,clearProcesses:function,resetProcessRemainingTimes:function}} Store state.
 */
export const useProcessStore = create((set) => ({
  processes: [],
  nextPid: 1,
  addProcess: (partial = {}) =>
    set((state) => {
      const pid = state.nextPid
      const process = addProcessHelper({
        ...partial,
        pid,
        remainingTime: partial.remainingTime ?? partial.burstTime ?? 0,
        color: partial.color ?? getProcessColor(pid),
        type: partial.type ?? 'cpu',
      })

      return {
        processes: [...state.processes, process],
        nextPid: state.nextPid + 1,
      }
    }),
  updateProcess: (pid, changes = {}) =>
    set((state) => {
      const processes = state.processes.map((item) => {
        if (item.pid !== pid) return item

        const burstTimeChanged = Object.prototype.hasOwnProperty.call(changes, 'burstTime')
        const nextBurstTime = burstTimeChanged ? Number(changes.burstTime ?? item.burstTime) : item.burstTime

        return {
          ...item,
          ...changes,
          name: changes.name ?? item.name,
          arrivalTime: Number.isFinite(Number(changes.arrivalTime ?? item.arrivalTime))
            ? Number(changes.arrivalTime ?? item.arrivalTime)
            : item.arrivalTime,
          burstTime: Number.isFinite(nextBurstTime) ? nextBurstTime : item.burstTime,
          remainingTime: burstTimeChanged
            ? Number.isFinite(nextBurstTime)
              ? Math.max(0, nextBurstTime)
              : item.remainingTime
            : Number.isFinite(Number(changes.remainingTime ?? item.remainingTime))
              ? Number(changes.remainingTime ?? item.remainingTime)
              : item.remainingTime,
          priority: Number.isFinite(Number(changes.priority ?? item.priority))
            ? Number(changes.priority ?? item.priority)
            : item.priority,
          color: changes.color ?? item.color,
          type: changes.type === 'io' ? 'io' : item.type,
        }
      })

      return { processes }
    }),
  removeProcess: (pid) =>
    set((state) => ({ processes: state.processes.filter((process) => process.pid !== pid) })),
  clearProcesses: () => set(() => ({ processes: [], nextPid: 1 })),
  resetProcessRemainingTimes: () =>
    set((state) => ({
      processes: state.processes.map((process) => ({ ...process, remainingTime: process.burstTime })),
    })),
}))

export default useProcessStore