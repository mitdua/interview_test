import { Routes, Route, Link } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import SetupPage from './pages/SetupPage'
import InterviewPage from './pages/InterviewPage'
import SummaryPage from './pages/SummaryPage'
import HistoryPage from './pages/HistoryPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <nav className="border-b border-gray-800/80 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link to="/" className="text-xl font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 rounded">
            Interview Practice
          </Link>
          <Link
            to="/history"
            className="rounded px-2 py-1 text-sm text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
          >
            History
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<SetupPage />} />
            <Route path="/interview/:sessionId" element={<InterviewPage />} />
            <Route path="/summary/:sessionId" element={<SummaryPage />} />
            <Route path="/history" element={<HistoryPage />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  )
}

export default App
