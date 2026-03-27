import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, ApiError } from '../services/api'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import AudioPlayer from '../components/AudioPlayer'
import ResultCard from '../components/ResultCard'
import Spinner from '../components/Spinner'
import type { QuestionResponse, AnswerResponse } from '../types'

type Phase =
  | 'loading'
  | 'playing'
  | 'recording'
  | 'submitting'
  | 'result'
  | 'finished'
  | 'error'

export default function InterviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const navigate = useNavigate()
  const { start: recorderStart, stop: recorderStop, reset: recorderReset } = useAudioRecorder()
  const started = useRef(false)

  const [phase, setPhase] = useState<Phase>('loading')
  const [question, setQuestion] = useState<QuestionResponse | null>(null)
  const [result, setResult] = useState<AnswerResponse | null>(null)
  const [error, setError] = useState('')
  const [questionCount, setQuestionCount] = useState(0)
  const [totalQuestions, setTotalQuestions] = useState<number | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showText, setShowText] = useState(false)
  const [showSuggested, setShowSuggested] = useState(false)

  // Fetch total questions on mount
  useEffect(() => {
    if (sessionId) {
      api.getSession(sessionId).then((s) => setTotalQuestions(s.num_questions)).catch(() => {})
    }
  }, [sessionId])

  // Recording timer
  useEffect(() => {
    if (phase !== 'recording') {
      setRecordingTime(0)
      return
    }
    const interval = setInterval(() => setRecordingTime((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [phase])

  const fetchQuestion = useCallback(async () => {
    setPhase('loading')
    setResult(null)
    setShowText(false)
    setShowSuggested(false)
    recorderReset()
    try {
      const q = await api.getNextQuestion(sessionId!)
      setQuestion(q)
      setQuestionCount((c) => c + 1)
      setPhase('playing')
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setPhase('finished')
      } else {
        setError(err instanceof Error ? err.message : 'Error')
        setPhase('error')
      }
    }
  }, [sessionId, recorderReset])

  // Auto-fetch first question
  useEffect(() => {
    if (!started.current) {
      started.current = true
      fetchQuestion()
    }
  }, [fetchQuestion])

  const handleAudioEnded = useCallback(() => {
    // Audio finished playing, ready to record
  }, [])

  const startRecording = async () => {
    try {
      await recorderStart()
      setPhase('recording')
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone access in your browser settings and reload.'
          : 'Could not access microphone. Make sure a microphone is connected.'
      setError(msg)
      setPhase('error')
    }
  }

  const stopRecording = async () => {
    const blob = await recorderStop()
    if (blob.size === 0) return

    setPhase('submitting')
    try {
      const res = await api.submitAnswer(sessionId!, question!.question_id, blob)
      setResult(res)
      setPhase('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
      setPhase('error')
    }
  }

  const goToSummary = () => navigate(`/summary/${sessionId}`)

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const progress = totalQuestions ? (questionCount / totalQuestions) * 100 : 0

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header with progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Interview</h1>
          <span className="text-sm text-gray-500">
            Question {questionCount}
            {totalQuestions ? ` of ${totalQuestions}` : ''}
          </span>
        </div>
        {totalQuestions ? (
          <div className="mt-3 h-1 overflow-hidden rounded-full bg-gray-800">
            <div
              className="h-full rounded-full bg-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : null}
      </div>

      {/* Loading */}
      {phase === 'loading' ? <Spinner label="Generating question..." /> : null}

      {/* Error */}
      {phase === 'error' ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-red-800/60 bg-red-900/20 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => fetchQuestion()}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-gray-300 transition-colors hover:bg-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
            >
              Retry
            </button>
            <button
              onClick={goToSummary}
              className="rounded-lg border border-gray-700/80 px-4 py-2 text-sm text-gray-400 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
            >
              End Interview
            </button>
          </div>
        </div>
      ) : null}

      {/* Playing question audio */}
      {phase === 'playing' && question ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-800/80 bg-gray-900 p-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              {question.is_follow_up ? 'Follow-up question' : 'Question'}
            </p>
            <button
              type="button"
              onClick={() => setShowText(!showText)}
              className="mb-4 flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 rounded"
            >
              <svg
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${showText ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showText ? 'Hide transcript' : 'Show transcript'}
            </button>
            {showText ? (
              <p className="mb-4 text-lg leading-relaxed text-gray-200">{question.question_text}</p>
            ) : null}
            <button
              type="button"
              onClick={() => setShowSuggested(!showSuggested)}
              className="mb-4 flex items-center gap-2 text-sm text-amber-600/80 transition-colors hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 rounded"
            >
              <svg
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${showSuggested ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showSuggested ? 'Hide suggested answer' : 'Show suggested answer'}
            </button>
            {showSuggested ? (
              <div className="mb-4 rounded-md border border-amber-800/40 bg-amber-950/20 p-3">
                <p className="text-sm leading-relaxed text-amber-200/90">{question.suggested_answer}</p>
              </div>
            ) : null}
            <AudioPlayer
              base64Audio={question.audio}
              onEnded={handleAudioEnded}
              autoPlay
            />
          </div>

          <button
            onClick={startRecording}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-4 text-lg font-medium text-white transition-colors hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
            </svg>
            Start Recording
          </button>
        </div>
      ) : null}

      {/* Recording */}
      {phase === 'recording' && question ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-800/80 bg-gray-900 p-5">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              {question.is_follow_up ? 'Follow-up question' : 'Question'}
            </p>
            <button
              type="button"
              onClick={() => setShowText(!showText)}
              className="flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 rounded"
            >
              <svg
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${showText ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showText ? 'Hide transcript' : 'Show transcript'}
            </button>
            {showText ? (
              <p className="mt-3 text-lg leading-relaxed text-gray-200">{question.question_text}</p>
            ) : null}
            <button
              type="button"
              onClick={() => setShowSuggested(!showSuggested)}
              className="mt-3 flex items-center gap-2 text-sm text-amber-600/80 transition-colors hover:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 rounded"
            >
              <svg
                className={`h-4 w-4 shrink-0 transition-transform duration-200 ${showSuggested ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showSuggested ? 'Hide suggested answer' : 'Show suggested answer'}
            </button>
            {showSuggested ? (
              <div className="mt-3 rounded-md border border-amber-800/40 bg-amber-950/20 p-3">
                <p className="text-sm leading-relaxed text-amber-200/90">{question.suggested_answer}</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col items-center gap-5 py-4">
            {/* Recording indicator */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-red-500/20" />
                <span className="relative h-4 w-4 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]" />
              </div>
              <span className="font-mono text-lg tabular-nums text-red-400">
                {formatTime(recordingTime)}
              </span>
              <span className="text-xs font-medium uppercase tracking-wider text-gray-500">Recording</span>
            </div>

            <button
              onClick={stopRecording}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-8 py-4 text-lg font-medium text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <rect x="5" y="5" width="10" height="10" rx="1" />
              </svg>
              Stop & Submit
            </button>
          </div>
        </div>
      ) : null}

      {/* Submitting */}
      {phase === 'submitting' ? <Spinner label="Evaluating your answer..." /> : null}

      {/* Result */}
      {phase === 'result' && result && question ? (
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-800/80 bg-gray-900 p-4">
            <p className="text-sm text-gray-400">{question.question_text}</p>
          </div>

          <ResultCard result={result} />

          <div className="flex gap-3">
            {result.has_follow_up ? (
              <button
                onClick={() => fetchQuestion()}
                className="flex-1 rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={goToSummary}
                className="flex-1 rounded-lg bg-purple-600 px-6 py-3 font-medium text-white transition-colors hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
              >
                View Summary
              </button>
            )}
            {result.has_follow_up ? (
              <button
                onClick={goToSummary}
                className="rounded-lg border border-gray-700/80 bg-gray-900 px-6 py-3 font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60"
              >
                Finish
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Finished */}
      {phase === 'finished' ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <p className="text-lg text-gray-300">All questions answered!</p>
          <button
            onClick={goToSummary}
            className="rounded-lg bg-purple-600 px-8 py-3 font-medium text-white transition-colors hover:bg-purple-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950"
          >
            View Summary
          </button>
        </div>
      ) : null}
    </div>
  )
}
