/**
 * Zustand store for computed simulation metrics.
 */
import { create } from 'zustand'
import { computeMetrics } from '../utils/metricsCalc.js'

/**
 * Create the metrics store.
 *
 * @returns {{metrics:object|null,computeAndStore:function}} Store state.
 */
export const useMetricsStore = create((set) => ({
  metrics: null,
  computeAndStore: (timeline, processes) =>
    set(() => ({ metrics: computeMetrics(timeline, processes) })),
}))

export default useMetricsStore