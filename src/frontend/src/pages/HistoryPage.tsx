import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../services/api'
import { scoreColor } from '../utils/score'
import Spinner from '../components/Spinner'
import type { SessionListItem } from '../types'

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    in_progress: 'border-yellow-500/60 text-yellow-400 bg-yellow-950/40',
    completed: 'border-green-500/60 text-green-400 bg-green-950/40',
  }
  return (
    <span
      className={`rounded-full border px-2 py-0.5 text-xs font-medium ${colors[status] ?? 'border-gray-600 text-gray-400'}`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

function scoreDisplay(score: number | null) {
  if (score === null) return <span className="text-gray-600">--</span>
  return <span className={`text-lg font-bold ${scoreColor(score).split(' ')[0]}`}>{score.toFixed(1)}</span>
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSessions = () => {
    setLoading(true)
    setError(null)
    api
      .listSessions()
      .then(setSessions)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  if (loading) return <Spinner />

  if (error) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-12 text-center">
        <div className="rounded-lg border border-red-800/60 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
        <button
          onClick={fetchSessions}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Session History</h1>
        <Link
          to="/"
          className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          New Session
        </Link>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-gray-800/80 bg-gray-900 py-16 text-center">
          <p className="text-gray-400">No sessions yet.</p>
          <Link to="/" className="mt-2 inline-block text-sm text-purple-400 hover:text-purple-300">
            Start your first interview
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Link
              key={s.session_id}
              to={
                s.status === 'completed'
                  ? `/summary/${s.session_id}`
                  : `/interview/${s.session_id}`
              }
              className="flex items-center gap-4 rounded-lg border border-gray-800/80 bg-gray-900 px-5 py-4 transition-colors hover:border-gray-700 hover:bg-gray-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
            >
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-gray-200">
                  {s.context_preview || 'No context'}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {formatDate(s.created_at)} · {s.num_questions} questions
                </p>
              </div>
              <div className="flex items-center gap-3">
                {scoreDisplay(s.average_score)}
                {statusBadge(s.status)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
