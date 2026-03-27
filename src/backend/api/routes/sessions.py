from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from src.backend.api.schemas import (
    SessionCreate,
    SessionDetailResponse,
    SessionListItem,
    SessionResponse,
    SummaryResponse,
)
from src.backend.core.database import get_db
from src.backend.services import interview

router = APIRouter(prefix="/sessions", tags=["sessions"])


@router.post("", response_model=SessionResponse)
async def create_session(body: SessionCreate, db: AsyncSession = Depends(get_db)):
    session = await interview.create_session(
        db,
        context=body.context,
        num_questions=body.num_questions,
        follow_up_mode=body.follow_up_mode,
    )
    return SessionResponse(
        session_id=session.id,
        status=session.status,
        num_questions=session.num_questions,
    )


@router.get("", response_model=list[SessionListItem])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    sessions = await interview.list_sessions(db)
    return [
        SessionListItem(
            session_id=s.id,
            context_preview=s.context[:100] if s.context else "",
            num_questions=s.num_questions,
            average_score=s.average_score,
            status=s.status,
            created_at=s.created_at,
        )
        for s in sessions
    ]


@router.get("/{session_id}", response_model=SessionDetailResponse)
async def get_session(session_id: str, db: AsyncSession = Depends(get_db)):
    session = await interview.get_session(db, session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionDetailResponse(
        session_id=session.id,
        context=session.context,
        num_questions=session.num_questions,
        follow_up_mode=session.follow_up_mode,
        status=session.status,
        average_score=session.average_score,
        created_at=session.created_at,
    )


@router.get("/{session_id}/summary", response_model=SummaryResponse)
async def get_summary(session_id: str, db: AsyncSession = Depends(get_db)):
    result = await interview.get_summary(db, session_id)
    return SummaryResponse(**result)
