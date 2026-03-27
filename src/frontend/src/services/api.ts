import type {
  SessionCreate,
  SessionResponse,
  SessionListItem,
  SessionDetail,
  QuestionResponse,
  AnswerResponse,
  SummaryResponse,
} from '../types'

const BASE = '/api'

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, init)
  if (!res.ok) {
    let message = res.statusText
    try {
      const body = await res.json()
      message = body.detail || JSON.stringify(body)
    } catch {
      message = (await res.text()) || res.statusText
    }
    throw new ApiError(message, res.status)
  }
  return res.json()
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

export const api = {
  createSession(data: SessionCreate): Promise<SessionResponse> {
    return request('/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  },

  listSessions(): Promise<SessionListItem[]> {
    return request('/sessions')
  },

  getSession(sessionId: string): Promise<SessionDetail> {
    return request(`/sessions/${sessionId}`)
  },

  getNextQuestion(sessionId: string): Promise<QuestionResponse> {
    return request(`/sessions/${sessionId}/next-question`)
  },

  submitAnswer(
    sessionId: string,
    questionId: string,
    audioBlob: Blob,
  ): Promise<AnswerResponse> {
    const form = new FormData()
    form.append('audio', audioBlob, 'answer.webm')
    return request(`/sessions/${sessionId}/questions/${questionId}/answer`, {
      method: 'POST',
      body: form,
    })
  },

  getSummary(sessionId: string): Promise<SummaryResponse> {
    return request(`/sessions/${sessionId}/summary`)
  },
}
