/**
 * Application mount point with an inline error boundary.
 */
import { Component } from 'react'
import { RefreshCcw, TriangleAlert } from 'lucide-react'
import AppLayout from './components/layout/AppLayout.jsx'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-screen items-center justify-center bg-surface px-6 text-text-primary">
          <div className="max-w-lg rounded-3xl border border-border bg-surface-1 p-6 shadow-2xl shadow-black/30">
            <div className="flex items-center gap-3 text-accent-red">
              <TriangleAlert className="h-5 w-5" />
              <h1 className="font-display text-2xl font-bold">Something went wrong</h1>
            </div>
            <p className="mt-4 font-body text-sm leading-6 text-text-muted">
              {this.state.error?.message ?? 'The simulator failed to render.'}
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-6 inline-flex items-center gap-2 rounded-md border border-accent-cyan px-4 py-2 font-mono text-xs text-accent-cyan transition hover:bg-accent-cyan/10"
            >
              <RefreshCcw className="h-4 w-4" />
              Reload
            </button>
          </div>
        </main>
      )
    }

    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AppLayout />
    </ErrorBoundary>
  )
}

export default App

