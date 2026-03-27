import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: string | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-xl py-20 text-center">
          <h2 className="mb-2 text-xl font-bold text-red-400">Something went wrong</h2>
          <p className="mb-4 text-sm text-gray-400">{this.state.error}</p>
          <button
            onClick={() => this.setState({ error: null })}
            className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
