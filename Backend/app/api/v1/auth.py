from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LogoutRequest,
    RefreshTokenRequest,
    ResetPasswordRequest,
    Token,
    UserCreate,
    UserLogin,
    UserResponse,
    UserRole,
)
from app.services.auth_service import (
    create_user,
    login_user,
    normalize_email,
    refresh_user_session,
    request_password_reset,
    reset_password,
    revoke_refresh_token,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Your session has expired. Please sign in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    email = payload.get("sub")
    if not email:
        raise credentials_exception

    user = db.query(User).filter(User.email == normalize_email(email)).first()
    if user is None or not user.is_active:
        raise credentials_exception

    return user


def require_roles(*roles: UserRole):
    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You do not have permission to perform this action.")
        return current_user

    return dependency


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    new_user = create_user(db, user)

    if not new_user:
        raise HTTPException(status_code=400, detail="Email already exists")

    return new_user


@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    token = login_user(db, user)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    db_user = db.query(User).filter(User.email == normalize_email(user.email)).first()
    if db_user:
        from app.services.activity_service import record_activity
        record_activity(db, activity_type="user_login", message=f"User {db_user.email} signed in", actor_id=db_user.id)
        db.commit()

    return token


@router.post("/refresh", response_model=Token)
def refresh(request: RefreshTokenRequest, db: Session = Depends(get_db)):
    token = refresh_user_session(db, request.refresh_token)
    if token is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is invalid or expired")
    return token


@router.post("/logout")
def logout(request: LogoutRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    revoke_refresh_token(db, request.refresh_token)
    return {"message": "Signed out successfully"}


@router.post(
    "/forgot-password",
    response_model=ForgotPasswordResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def forgot_password(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    request_password_reset(db, request.email)
    return {"message": "If the account exists, a reset link will be sent."}


@router.post("/reset-password", response_model=ForgotPasswordResponse)
def reset_password_route(request: ResetPasswordRequest, db: Session = Depends(get_db)):
    if not reset_password(db, request.token, request.new_password):
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired")

    return {"message": "Your password has been updated. You can now sign in."}
