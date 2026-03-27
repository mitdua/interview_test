import type { AnswerResponse } from '../types'
import { scoreColor } from '../utils/score'

interface Props {
  result: AnswerResponse
}

export default function ResultCard({ result }: Props) {
  return (
    <div className="space-y-4 rounded-lg border border-gray-800/80 bg-gray-900 p-5">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 text-2xl font-bold ${scoreColor(result.score)}`}
        >
          {result.score}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="mb-1 text-sm font-medium text-gray-500">Your answer</h3>
          <p className="text-sm leading-relaxed text-gray-300">{result.transcription}</p>
        </div>
      </div>

      <div>
        <h3 className="mb-1 text-sm font-medium text-gray-500">Feedback</h3>
        <p className="text-sm leading-relaxed text-gray-300">{result.feedback}</p>
      </div>

      {result.improved_answer ? (
        <div>
          <h3 className="mb-1 text-sm font-medium text-purple-400">Improved answer</h3>
          <p className="text-sm leading-relaxed text-gray-300 italic">{result.improved_answer}</p>
        </div>
      ) : null}
    </div>
  )
}
