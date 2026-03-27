import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'

export default function SetupPage() {
  const navigate = useNavigate()
  const [context, setContext] = useState('')
  const [numQuestions, setNumQuestions] = useState(5)
  const [followUpMode, setFollowUpMode] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const session = await api.createSession({
        context,
        num_questions: numQuestions,
        follow_up_mode: followUpMode,
      })
      navigate(`/interview/${session.session_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-2 text-3xl font-bold">New Interview Session</h1>
      <p className="mb-8 text-gray-400">
        Practice answering interview questions with AI-generated audio prompts.
      </p>

      {error ? (
        <div className="mb-6 rounded-lg border border-red-800/60 bg-red-900/20 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-300">
            Context / Job Description
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={5}
            required
            placeholder="Paste the job description or describe the role you're preparing for..."
            className="w-full rounded-lg border border-gray-700/80 bg-gray-800/50 px-4 py-3 text-gray-100 placeholder-gray-500 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/60"
          />
        </div>

        <div className="flex gap-6">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Number of Questions
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={numQuestions}
              onChange={(e) => setNumQuestions(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-700/80 bg-gray-800/50 px-4 py-3 text-gray-100 transition-colors focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/60"
            />
          </div>

          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-gray-300">
              Follow-up Mode
            </label>
            <button
              type="button"
              onClick={() => setFollowUpMode(!followUpMode)}
              className={`w-full rounded-lg border px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 ${
                followUpMode
                  ? 'border-purple-500/60 bg-purple-500/15 text-purple-300'
                  : 'border-gray-700/80 bg-gray-800/50 text-gray-400 hover:border-gray-600'
              }`}
            >
              {followUpMode ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !context.trim()}
          className="w-full rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-purple-600"
        >
          {loading ? 'Creating...' : 'Start Interview'}
        </button>
      </form>
    </div>
  )
}
