from datetime import datetime

from pydantic import BaseModel


# --- Request schemas ---


class SessionCreate(BaseModel):
    context: str = ""
    num_questions: int = 5
    follow_up_mode: bool = False


# --- Response schemas ---


class SessionResponse(BaseModel):
    session_id: str
    status: str
    num_questions: int


class SessionDetailResponse(BaseModel):
    session_id: str
    context: str
    num_questions: int
    follow_up_mode: bool
    status: str
    average_score: float | None
    created_at: datetime


class SessionListItem(BaseModel):
    session_id: str
    context_preview: str
    num_questions: int
    average_score: float | None
    status: str
    created_at: datetime


class QuestionResponse(BaseModel):
    question_id: str
    position: int
    question_text: str
    suggested_answer: str
    audio: str  # base64 encoded
    is_follow_up: bool


class AnswerResponse(BaseModel):
    transcription: str
    score: int
    feedback: str
    improved_answer: str | None
    has_follow_up: bool


class QuestionSummaryItem(BaseModel):
    position: int
    question_text: str
    score: int | None
    feedback: str | None


class SummaryResponse(BaseModel):
    average_score: float | None
    general_feedback: str | None
    questions: list[QuestionSummaryItem]
