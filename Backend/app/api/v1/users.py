from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.user import ProfileUpdate, UserResponse
from app.services.auth_service import normalize_email

router = APIRouter(tags=["Users"])


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    full_name = profile.full_name.strip()
    email = normalize_email(profile.email)
    if len(full_name) < 2:
        raise HTTPException(status_code=422, detail="Full name must contain at least two characters")

    duplicate = db.query(User).filter(
        User.email == email,
        User.id != current_user.id,
    ).first()
    if duplicate:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already exists")

    current_user.full_name = full_name
    current_user.email = email
    db.commit()
    db.refresh(current_user)

    return current_user
