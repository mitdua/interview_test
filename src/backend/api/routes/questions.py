from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.api.schemas import AnswerResponse, QuestionResponse
from src.backend.core.database import get_db
from src.backend.services import interview

router = APIRouter(prefix="/sessions", tags=["questions"])


@router.get("/{session_id}/next-question", response_model=QuestionResponse)
async def next_question(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await interview.get_next_question(db, session_id)
    return QuestionResponse(**result)


@router.post(
    "/{session_id}/questions/{question_id}/answer",
    response_model=AnswerResponse,
)
async def submit_answer(
    session_id: str,
    question_id: str,
    audio: UploadFile,
    db: AsyncSession = Depends(get_db),
):
    audio_data = await audio.read()
    mime_type = audio.content_type or "audio/webm"

    result = await interview.submit_answer(
        db,
        session_id=session_id,
        question_id=question_id,
        audio_data=audio_data,
        mime_type=mime_type,
    )
    return AnswerResponse(**result)
