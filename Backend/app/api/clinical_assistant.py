from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import User
from app.schemas.clinical_assistant import (
    ChatRequest,
    ChatResponse,
    ChatSessionDetail,
    ChatSessionSummary,
)
from app.services.ai_provider import get_ai_provider
from app.services.clinical_assistant_service import (
    delete_chat_session,
    generate_assistant_response,
    get_chat_session_detail,
    list_chat_sessions,
)

router = APIRouter(prefix="/clinical-assistant", tags=["AI Clinical Assistant"])

@router.post("/chat", response_model=ChatResponse)
def chat_with_assistant(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    try:
        return generate_assistant_response(db, payload, current_user)
    except HTTPException:
        raise
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err)
        )
    except Exception as err:
        err_msg = str(err)
        if "External AI Provider" in err_msg or "AI Provider error" in err_msg:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Configured external AI provider could not be reached: {err_msg}"
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred in the AI assistant service: {err_msg}"
        )

@router.post("/chat/stream")
def stream_chat_with_assistant(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    try:
        response = generate_assistant_response(db, payload, current_user)
    except HTTPException:
        raise
    except Exception as err:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(err))

    def event_stream():
        import json
        yield f"event: context\ndata: {json.dumps(response.context_summary.model_dump())}\n\n"
        if response.citations:
            yield f"event: citations\ndata: {json.dumps([c.model_dump() for c in response.citations])}\n\n"

        words = response.answer.split(" ")
        for i, word in enumerate(words):
            chunk = word + (" " if i < len(words) - 1 else "")
            yield f"event: token\ndata: {json.dumps({'token': chunk})}\n\n"

        yield f"event: done\ndata: {json.dumps({'session_id': response.session_id, 'provider': response.provider})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")

@router.get("/sessions", response_model=list[ChatSessionSummary])
def get_user_chat_sessions(
    patient_id: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    return list_chat_sessions(db, current_user.id, patient_id=patient_id)

@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
def get_single_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    detail = get_chat_session_detail(db, session_id, current_user.id)
    if not detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    return detail

@router.delete("/sessions/{session_id}")
def delete_single_chat_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    success = delete_chat_session(db, session_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Chat session not found")
    return {"message": "Chat session deleted successfully"}

@router.get("/health")
def get_assistant_health(
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    provider = get_ai_provider()
    return provider.health_check()

