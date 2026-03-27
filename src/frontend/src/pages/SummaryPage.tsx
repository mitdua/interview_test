import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../services/api'
import { scoreColor, scoreBg } from '../utils/score'
import Spinner from '../components/Spinner'
import type { SummaryResponse } from '../types'

export default function SummaryPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const [summary, setSummary] = useState<SummaryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)

  const fetchSummary = () => {
    setLoading(true)
    setError(null)
    api
      .getSummary(sessionId!)
      .then(setSummary)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  if (loading) return <Spinner label="Generating summary..." />

  if (error) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-12 text-center">
        <div className="rounded-lg border border-red-800/60 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
        <button
          onClick={fetchSummary}
          className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!summary) return null

  return (
    <div className="mx-auto max-w-2xl">
      {/* Average Score */}
      <div className="mb-8 text-center">
        <h1 className="mb-4 text-3xl font-bold">Interview Summary</h1>
        {summary.average_score !== null ? (
          <div
            className={`mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 text-4xl font-bold ${scoreColor(summary.average_score)}`}
          >
            {summary.average_score.toFixed(1)}
          </div>
        ) : null}
        <p className="mt-2 text-sm text-gray-500">Average Score</p>
      </div>

      {/* General Feedback */}
      {summary.general_feedback ? (
        <div className="mb-8 rounded-lg border border-gray-800/80 bg-gray-900 p-5">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-gray-500">
            General Feedback
          </h2>
          <p className="leading-relaxed text-gray-300 whitespace-pre-line">{summary.general_feedback}</p>
        </div>
      ) : null}

      {/* Questions List */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-500">
          Questions ({summary.questions.length})
        </h2>
        <div className="space-y-2">
          {summary.questions.map((q) => (
            <div key={q.position} className="rounded-lg border border-gray-800/80 bg-gray-900">
              <button
                onClick={() => setExpanded(expanded === q.position ? null : q.position)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-800/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-purple-500/60"
              >
                {q.score !== null ? (
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${scoreColor(q.score)} ${scoreBg(q.score)}`}
                  >
                    {q.score}
                  </span>
                ) : null}
                <span className="flex-1 text-sm text-gray-200 truncate">
                  {q.question_text}
                </span>
                <svg
                  className={`h-4 w-4 shrink-0 text-gray-500 transition-transform duration-200 ${expanded === q.position ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expanded === q.position && q.feedback ? (
                <div className="border-t border-gray-800/80 px-4 py-3">
                  <p className="text-sm leading-relaxed text-gray-400">{q.feedback}</p>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Link
          to="/"
          className="flex-1 rounded-lg bg-purple-600 px-6 py-3 text-center font-medium text-white transition-colors hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
        >
          New Interview
        </Link>
        <Link
          to="/history"
          className="rounded-lg border border-gray-700/80 bg-gray-900 px-6 py-3 text-center font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
        >
          History
        </Link>
      </div>
    </div>
  )
}
