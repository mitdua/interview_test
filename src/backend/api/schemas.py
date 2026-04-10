from datetime import datetime

from pydantic import BaseModel


# --- Request schemas ---


from typing import Literal

ENGLISH_LEVELS = Literal["A1", "A2", "B1", "B2", "C1", "C2"]


class SessionCreate(BaseModel):
    context: str = ""
    num_questions: int = 5
    follow_up_mode: bool = False
    english_level: ENGLISH_LEVELS = "B1"


# --- Response schemas ---


class SessionResponse(BaseModel):
    session_id: str
    status: str
    num_questions: int
    english_level: str


class SessionDetailResponse(BaseModel):
    session_id: str
    context: str
    num_questions: int
    follow_up_mode: bool
    english_level: str
    status: str
    average_score: float | None
    created_at: datetime


class SessionListItem(BaseModel):
    session_id: str
    context_preview: str
    num_questions: int
    english_level: str
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
