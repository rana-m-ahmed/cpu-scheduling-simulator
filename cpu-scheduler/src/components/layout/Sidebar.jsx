/**
 * Collapsible left sidebar for algorithm, parameter, and process controls.
 */
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import AlgorithmSelector from '../controls/AlgorithmSelector.jsx'
import ParameterPanel from '../controls/ParameterPanel.jsx'

/**
 * Render the app sidebar.
 *
 * @param {{isOpen:boolean,onClose:function}} props - Sidebar props.
 * @returns {JSX.Element} Sidebar UI.
 */
export function Sidebar({ isOpen, onClose }) {
  return (
    <motion.aside
      className="w-full shrink-0 overflow-hidden border-b border-border bg-surface-1/90 backdrop-blur-sm lg:w-72 lg:border-b-0 lg:border-r"
      animate={{ maxWidth: isOpen ? '100%' : 0, opacity: isOpen ? 1 : 0.4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 32 }}
      aria-hidden={!isOpen}
      style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
    >
      <div className="flex h-full min-h-0 w-full flex-col lg:w-72">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 lg:hidden">
          <p className="font-mono text-xs uppercase tracking-widest text-text-faint">Controls</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-surface text-text-muted transition hover:border-accent-cyan hover:text-accent-cyan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-3 sm:space-y-5 sm:p-4">
          <section className="space-y-3">
            <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">Algorithm</h2>
            <AlgorithmSelector />
          </section>

          <section className="space-y-3">
            <h2 className="font-mono text-xs uppercase tracking-widest text-text-faint">Parameters</h2>
            <ParameterPanel />
          </section>
        </div>
      </div>
    </motion.aside>
  )
}

export default Sidebar