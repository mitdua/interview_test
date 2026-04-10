export type EnglishLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export interface SessionCreate {
  context: string
  num_questions: number
  follow_up_mode: boolean
  english_level: EnglishLevel
}

export interface SessionResponse {
  session_id: string
  status: string
  num_questions: number
  english_level: string
}

export interface SessionListItem {
  session_id: string
  context_preview: string
  num_questions: number
  english_level: string
  average_score: number | null
  status: string
  created_at: string
}

export interface SessionDetail {
  session_id: string
  context: string
  num_questions: number
  follow_up_mode: boolean
  english_level: string
  status: string
  average_score: number | null
  created_at: string
}

export interface QuestionResponse {
  question_id: string
  position: number
  question_text: string
  suggested_answer: string
  audio: string
  is_follow_up: boolean
}

export interface AnswerResponse {
  transcription: string
  score: number
  feedback: string
  improved_answer: string
  has_follow_up: boolean
}

export interface QuestionSummaryItem {
  position: number
  question_text: string
  score: number | null
  feedback: string | null
}

export interface SummaryResponse {
  average_score: number
  general_feedback: string
  questions: QuestionSummaryItem[]
}
