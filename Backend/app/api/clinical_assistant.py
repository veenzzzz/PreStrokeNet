from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user, require_roles
from app.core.database import get_db
from app.models.user import User
from app.schemas.clinical_assistant import ChatRequest, ChatResponse
from app.services.ai_provider import get_ai_provider
from app.services.clinical_assistant_service import generate_assistant_response

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

@router.get("/health")
def get_assistant_health(
    current_user: User = Depends(require_roles("Admin", "Doctor"))
):
    provider = get_ai_provider()
    return provider.health_check()
