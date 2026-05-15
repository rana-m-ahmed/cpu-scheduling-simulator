/**
 * Deterministic process color helpers for visualizing scheduler identities.
 */
export const PROCESS_COLORS = [
  '#22d3ee',
  '#38bdf8',
  '#818cf8',
  '#a855f7',
  '#f472b6',
  '#fb7185',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
]

export function getProcessColor(pid) {
  const numericPid = Number(pid)
  const index = Number.isFinite(numericPid)
    ? Math.abs(numericPid) % PROCESS_COLORS.length
    : 0

  return PROCESS_COLORS[index]
}