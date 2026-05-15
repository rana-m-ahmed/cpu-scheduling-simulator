import { useState } from 'react'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'
import { GanttChart } from '../visualization/GanttChart.jsx'
import { SimulationControls } from '../controls/SimulationControls.jsx'
import { MetricsDashboard } from '../metrics/MetricsDashboard.jsx'
import { AdaptiveFeedbackPanel } from '../feedback/AdaptiveFeedbackPanel.jsx'
import { ProcessForm } from '../process/ProcessForm.jsx'
import { ProcessTable } from '../process/ProcessTable.jsx'
import { useProcessStore } from '../../store/processStore.js'

function LoadSampleButton() {
  const addProcess = useProcessStore((state) => state.addProcess)

  const samples = [
    { name: 'P1', arrivalTime: 0, burstTime: 4 },
    { name: 'P2', arrivalTime: 1, burstTime: 3 },
    { name: 'P3', arrivalTime: 2, burstTime: 5 },
    { name: 'P4', arrivalTime: 3, burstTime: 2 },
    { name: 'P5', arrivalTime: 5, burstTime: 4 },
  ]

  return (
    <button
      type="button"
      onClick={() => samples.forEach((process) => addProcess(process))}
      aria-label="Load sample processes"
      className="inline-flex w-full items-center justify-center rounded-md border border-border bg-surface px-3 py-2 text-sm font-mono text-text-primary transition hover:border-accent-cyan hover:text-accent-cyan sm:w-auto"
    >
      Load Sample Processes
    </button>
  )
}

function ProcessWorkspace() {
  const processCount = useProcessStore((state) => state.processes.length)

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4 rounded-3xl border border-border bg-surface-1/80 p-4 shadow-2xl shadow-black/20 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-border/60 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Process workspace</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-text-primary">Add and manage processes</h2>
        </div>
        <p className="font-mono text-xs uppercase tracking-wider text-text-faint">{processCount} processes</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <LoadSampleButton />
      </div>

      <ProcessForm />
      <ProcessTable />
    </section>
  )
}

export default function AppLayout() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="min-h-screen overflow-x-hidden bg-surface text-text-primary">
      <Header onToggleSidebar={() => setIsOpen((v) => !v)} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-3 sm:px-4 sm:py-4 lg:flex-row lg:gap-6 lg:px-6 xl:px-8">
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />

        <main className="min-w-0 flex-1 space-y-4 sm:space-y-6">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,320px)] xl:gap-6">
            <GanttChart />

            <div className="space-y-4 sm:space-y-6">
              <SimulationControls />
              <AdaptiveFeedbackPanel />
            </div>
          </div>

          <ProcessWorkspace />

          <MetricsDashboard />
        </main>
      </div>
    </div>
  )
}
