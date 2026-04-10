import base64
import uuid
from pathlib import Path

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from src.backend.core.config import PROJECT_ROOT
from src.backend.core.dependencies import llm_provider, stt_provider, tts_provider
from src.backend.models.session import Answer, Question, Session

AUDIO_DIR = PROJECT_ROOT / "audio_answers"
AUDIO_DIR.mkdir(exist_ok=True)

MIN_AUDIO_BYTES = 1000  # reject very short/empty recordings


async def create_session(
    db: AsyncSession,
    context: str,
    num_questions: int,
    follow_up_mode: bool,
    english_level: str = "B1",
) -> Session:
    if not context.strip():
        raise HTTPException(status_code=400, detail="Context cannot be empty")
    if num_questions < 1 or num_questions > 20:
        raise HTTPException(status_code=400, detail="num_questions must be between 1 and 20")

    session = Session(
        context=context,
        num_questions=num_questions,
        follow_up_mode=follow_up_mode,
        english_level=english_level,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def list_sessions(db: AsyncSession) -> list[Session]:
    result = await db.execute(
        select(Session).order_by(Session.created_at.desc())
    )
    return list(result.scalars().all())


async def get_session(db: AsyncSession, session_id: str) -> Session | None:
    return await db.get(Session, session_id)


async def get_next_question(db: AsyncSession, session_id: str) -> dict:
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status == "completed":
        raise HTTPException(status_code=409, detail="Session already completed")

    # Load existing questions with answers
    result = await db.execute(
        select(Question)
        .where(Question.session_id == session_id)
        .options(selectinload(Question.answer))
        .order_by(Question.position)
    )
    existing = list(result.scalars().all())

    # Check if we've reached the limit
    answered_count = sum(1 for q in existing if q.answer is not None)
    if answered_count >= session.num_questions:
        raise HTTPException(status_code=409, detail="All questions answered")

    # Check if there's an unanswered question already
    unanswered = [q for q in existing if q.answer is None]
    if unanswered:
        q = unanswered[0]
        audio_b64 = base64.b64encode(q.question_audio).decode() if q.question_audio else ""
        return {
            "question_id": q.id,
            "position": q.position,
            "question_text": q.question_text,
            "suggested_answer": q.suggested_answer or "",
            "audio": audio_b64,
            "is_follow_up": q.is_follow_up,
        }

    # Build previous Q&A context
    previous_qa = []
    for q in existing:
        if q.answer:
            previous_qa.append({
                "position": q.position,
                "question": q.question_text,
                "answer": q.answer.transcription or "",
            })

    # Determine if this should be a follow-up
    position = len(existing) + 1
    is_follow_up = session.follow_up_mode and len(previous_qa) > 0

    # Generate question via LLM
    try:
        generated = await llm_provider.call(
            "generate_question",
            context=session.context,
            position=position,
            previous_qa=previous_qa,
            is_follow_up=is_follow_up,
            english_level=session.english_level,
        )
    except Exception:
        raise HTTPException(status_code=503, detail="Failed to generate question. Please try again.")

    # Generate TTS audio
    try:
        tts_result = await tts_provider.call("synthesize", text=generated.question_text)
    except Exception:
        raise HTTPException(status_code=503, detail="Failed to generate audio. Please try again.")

    # Save question to DB
    question = Question(
        session_id=session_id,
        position=position,
        question_text=generated.question_text,
        suggested_answer=generated.suggested_answer,
        question_audio=tts_result.audio_data,
        is_follow_up=is_follow_up,
    )
    db.add(question)
    await db.commit()
    await db.refresh(question)

    audio_b64 = base64.b64encode(tts_result.audio_data).decode()

    return {
        "question_id": question.id,
        "position": question.position,
        "question_text": question.question_text,
        "suggested_answer": question.suggested_answer or "",
        "audio": audio_b64,
        "is_follow_up": question.is_follow_up,
    }


async def submit_answer(
    db: AsyncSession,
    session_id: str,
    question_id: str,
    audio_data: bytes,
    mime_type: str,
) -> dict:
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status == "completed":
        raise HTTPException(status_code=409, detail="Session already completed")

    question = await db.get(Question, question_id)
    if not question or question.session_id != session_id:
        raise HTTPException(status_code=404, detail="Question not found in this session")

    # Check if already answered
    existing_answer = await db.execute(
        select(Answer).where(Answer.question_id == question_id)
    )
    if existing_answer.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Question already answered")

    # Validate audio
    if len(audio_data) < MIN_AUDIO_BYTES:
        raise HTTPException(status_code=400, detail="Recording too short. Please try again.")

    # Save audio file to disk
    ext = mime_type.split("/")[-1].split(";")[0]
    filename = f"{uuid.uuid4()}.{ext}"
    audio_path = AUDIO_DIR / filename
    audio_path.write_bytes(audio_data)

    # Transcribe audio via STT
    try:
        transcription = await stt_provider.call(
            "transcribe", audio_data=audio_data, mime_type=mime_type
        )
    except Exception:
        raise HTTPException(status_code=503, detail="Failed to transcribe audio. Please try again.")

    # Evaluate answer via LLM
    try:
        evaluation = await llm_provider.call(
            "evaluate_answer",
            context=session.context,
            question_text=question.question_text,
            transcription=transcription,
            english_level=session.english_level,
        )
    except Exception:
        raise HTTPException(status_code=503, detail="Failed to evaluate answer. Please try again.")

    # Save answer
    answer = Answer(
        question_id=question_id,
        audio_path=str(audio_path),
        transcription=transcription,
        score=evaluation.score,
        feedback=evaluation.feedback,
        improved_answer=evaluation.improved_answer,
        provider_used="primary",
    )
    db.add(answer)
    await db.commit()

    # Check if interview is complete
    result = await db.execute(
        select(Question)
        .where(Question.session_id == session_id)
        .options(selectinload(Question.answer))
    )
    all_questions = list(result.scalars().all())
    answered_count = sum(1 for q in all_questions if q.answer is not None)
    has_more = answered_count < session.num_questions

    return {
        "transcription": transcription,
        "score": evaluation.score,
        "feedback": evaluation.feedback,
        "improved_answer": evaluation.improved_answer,
        "has_follow_up": has_more,
    }


async def get_summary(db: AsyncSession, session_id: str) -> dict:
    session = await db.get(Session, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    result = await db.execute(
        select(Question)
        .where(Question.session_id == session_id)
        .options(selectinload(Question.answer))
        .order_by(Question.position)
    )
    questions = list(result.scalars().all())

    questions_data = []
    for q in questions:
        questions_data.append({
            "position": q.position,
            "question_text": q.question_text,
            "score": q.answer.score if q.answer else None,
            "feedback": q.answer.feedback if q.answer else None,
        })

    # Generate summary if not already done
    if not session.general_feedback:
        try:
            summary = await llm_provider.call(
                "generate_summary",
                context=session.context,
                questions_and_scores=questions_data,
                english_level=session.english_level,
            )
            session.average_score = summary.average_score
            session.general_feedback = summary.general_feedback
            session.status = "completed"
            await db.commit()
        except Exception:
            raise HTTPException(status_code=503, detail="Failed to generate summary. Please try again.")

    return {
        "average_score": session.average_score,
        "general_feedback": session.general_feedback,
        "questions": questions_data,
    }
