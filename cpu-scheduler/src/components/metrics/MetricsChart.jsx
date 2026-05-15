/**
 * Recharts-based comparison charts for scheduling metrics.
 */
import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  Cell,
} from 'recharts'
import { useMetrics } from '../../hooks/useMetrics.js'
import { useSimulator } from '../../hooks/useSimulator.js'
import { useProcessStore } from '../../store/processStore.js'

const TAB_OPTIONS = [
  { key: 'comparison', label: 'Wait & Turnaround' },
  { key: 'cpu', label: 'CPU Timeline' },
  { key: 'completion', label: 'Completion Order' },
]

function getColorMap(metrics, processes) {
  const processByPid = new Map(processes.map((process) => [process.pid, process]))

  return new Map((metrics?.perProcessRows ?? []).map((row) => [row.pid, processByPid.get(row.pid)?.color ?? row.color]))
}

function buildCpuTimeline(timeline) {
  const safeTimeline = Array.isArray(timeline) ? timeline : []
  const points = []
  let nonIdleTime = 0
  let totalTime = 0

  if (safeTimeline.length === 0) {
    return []
  }

  points.push({ time: 0, utilization: 0 })

  for (const segment of safeTimeline) {
    const start = Number(segment?.start ?? 0)
    const end = Number(segment?.end ?? 0)

    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
      continue
    }

    totalTime = Math.max(totalTime, end)

    if (segment.pid !== null) {
      nonIdleTime += end - start
    }

    points.push({
      time: end,
      utilization: totalTime > 0 ? (nonIdleTime / totalTime) * 100 : 0,
    })
  }

  return points
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-text-primary shadow-xl shadow-black/40">
      <p className="mb-1 text-text-muted">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} style={{ color: item.color }}>
          {item.name}: {Number(item.value).toFixed(2)}
        </p>
      ))}
    </div>
  )
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div className="rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-text-primary shadow-xl shadow-black/40">
      <p className="mb-1 text-text-muted">{label}</p>
      {payload.map((item) => (
        <p key={item.dataKey} style={{ color: item.color }}>
          {item.name}: {Number(item.value).toFixed(2)}
        </p>
      ))}
    </div>
  )
}

/**
 * Render the tabbed metrics chart set.
 *
 * @returns {JSX.Element} Metrics chart UI.
 */
export function MetricsChart() {
  const metrics = useMetrics()
  const { timeline } = useSimulator()
  const processes = useProcessStore((state) => state.processes)
  const [activeTab, setActiveTab] = useState('comparison')

  const colorMap = useMemo(() => getColorMap(metrics, processes), [metrics, processes])

  const comparisonData = useMemo(() => {
    return (metrics?.perProcessRows ?? []).map((row) => ({
      ...row,
      color: colorMap.get(row.pid) ?? row.color ?? '#22d3ee',
    }))
  }, [colorMap, metrics?.perProcessRows])

  const cpuTimelineData = useMemo(() => buildCpuTimeline(timeline), [timeline])

  const completionData = useMemo(() => {
    const rows = [...(metrics?.perProcessRows ?? [])]
    const rankMap = new Map((metrics?.raw?.completionOrder ?? []).map((pid, index) => [pid, index + 1]))

    return rows
      .filter((row) => rankMap.has(row.pid))
      .sort((left, right) => rankMap.get(left.pid) - rankMap.get(right.pid))
      .map((row) => ({
        ...row,
        rank: rankMap.get(row.pid),
        color: colorMap.get(row.pid) ?? row.color ?? '#22d3ee',
      }))
  }, [colorMap, metrics?.perProcessRows, metrics?.raw?.completionOrder])

  if (!metrics) {
    return null
  }

  return (
    <div className="rounded-xl border border-border bg-surface-1 p-4">
      <div className="mb-4 flex flex-wrap items-center gap-4 border-b border-border/60 pb-3">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={activeTab === tab.key ? 'border-b-2 border-accent-cyan pb-2 text-accent-cyan' : 'pb-2 text-text-muted hover:text-text-primary'}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height={280}>
          {activeTab === 'comparison' ? (
            <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#8b949e" tick={{ fill: '#8b949e', fontFamily: 'JetBrains Mono' }} />
              <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontFamily: 'JetBrains Mono' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ color: '#8b949e', fontFamily: 'JetBrains Mono' }} />
              <Bar dataKey="waitingTime" name="Waiting" fill="#22d3ee">
                {comparisonData.map((entry) => (
                  <Cell key={entry.pid} fill={entry.color} />
                ))}
              </Bar>
              <Bar dataKey="turnaroundTime" name="Turnaround" fill="#38bdf8" opacity={0.7}>
                {comparisonData.map((entry) => (
                  <Cell key={`${entry.pid}-turnaround`} fill={entry.color} opacity={0.65} />
                ))}
              </Bar>
            </BarChart>
          ) : null}

          {activeTab === 'cpu' ? (
            <AreaChart data={cpuTimelineData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
              <XAxis dataKey="time" stroke="#8b949e" tick={{ fill: '#8b949e', fontFamily: 'JetBrains Mono' }} />
              <YAxis stroke="#8b949e" tick={{ fill: '#8b949e', fontFamily: 'JetBrains Mono' }} domain={[0, 100]} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ color: '#8b949e', fontFamily: 'JetBrains Mono' }} />
              <Area
                type="stepAfter"
                dataKey="utilization"
                name="CPU Utilization"
                stroke="#22d3ee"
                fill="#22d3ee"
                fillOpacity={0.2}
              />
            </AreaChart>
          ) : null}

          {activeTab === 'completion' ? (
            <BarChart
              data={completionData}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid stroke="#30363d" strokeDasharray="3 3" />
              <XAxis type="number" stroke="#8b949e" tick={{ fill: '#8b949e', fontFamily: 'JetBrains Mono' }} />
              <YAxis dataKey="name" type="category" stroke="#8b949e" tick={{ fill: '#8b949e', fontFamily: 'JetBrains Mono' }} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ color: '#8b949e', fontFamily: 'JetBrains Mono' }} />
              <Bar dataKey="completionTime" name="Completion Time" radius={[0, 6, 6, 0]}>
                {completionData.map((entry) => (
                  <Cell key={entry.pid} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          ) : null}
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default MetricsChart