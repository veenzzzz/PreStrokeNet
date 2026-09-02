import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES, PASSWORD_RESET_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
from app.core.security import create_access_token, hash_password, verify_password
from app.models.password_reset_token import PasswordResetToken
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.services.email_service import send_password_reset_email


def normalize_email(email: str) -> str:
    return email.strip().lower()


def create_user(db: Session, user: UserCreate):
    email = normalize_email(user.email)
    existing_user = db.query(User).filter(User.email == email).first()

    if existing_user:
        return None

    db_user = User(
        full_name=user.full_name.strip(),
        email=email,
        password=hash_password(user.password),
        role="Doctor",
        is_active=True,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == normalize_email(email)).first()

    if not user or not user.is_active or not verify_password(password, user.password):
        return None

    return user


def _hash_refresh_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _create_session_tokens(db: Session, user: User) -> dict:
    raw_refresh_token = secrets.token_urlsafe(48)
    now = datetime.now(timezone.utc)
    refresh_record = RefreshToken(
        user_id=user.id,
        token_hash=_hash_refresh_token(raw_refresh_token),
        expires_at=now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_record)
    db.flush()
    access_token = create_access_token({"sub": user.email, "role": user.role})
    db.commit()
    db.refresh(user)
    return {
        "access_token": access_token,
        "refresh_token": raw_refresh_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        "user": user,
    }


def login_user(db: Session, user_login: UserLogin) -> dict | None:
    user = authenticate_user(db, user_login.email, user_login.password)

    if not user:
        return None

    return _create_session_tokens(db, user)


def refresh_user_session(db: Session, raw_refresh_token: str) -> dict | None:
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == _hash_refresh_token(raw_refresh_token)).first()
    if record is None or not record.is_active:
        return None

    user = db.get(User, record.user_id)
    if user is None or not user.is_active:
        return None

    record.revoked_at = datetime.now(timezone.utc)
    tokens = _create_session_tokens(db, user)
    replacement = db.query(RefreshToken).filter(RefreshToken.token_hash == _hash_refresh_token(tokens["refresh_token"])).first()
    if replacement is not None:
        record.replaced_by_id = replacement.id
    db.commit()
    return tokens


def revoke_refresh_token(db: Session, raw_refresh_token: str) -> bool:
    record = db.query(RefreshToken).filter(RefreshToken.token_hash == _hash_refresh_token(raw_refresh_token)).first()
    if record is None:
        return False
    record.revoked_at = datetime.now(timezone.utc)
    db.commit()
    return True


def delete_user(db: Session, user_id: int) -> bool:
    """Delete a user after explicitly removing dependent refresh rows.

    SQL Server cannot use the original user CASCADE because the token replacement
    self-reference creates a second cascading path. This is the application-level
    equivalent and keeps the database foreign key restrictive and deterministic.
    """
    user = db.get(User, user_id)
    if user is None:
        return False
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).update({RefreshToken.replaced_by_id: None}, synchronize_session=False)
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete(synchronize_session=False)
    db.delete(user)
    db.commit()
    return True


def _hash_reset_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def request_password_reset(db: Session, email: str) -> None:
    user = db.query(User).filter(User.email == normalize_email(email)).first()

    if not user:
        return

    now = datetime.now(timezone.utc)
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used_at.is_(None),
    ).update({PasswordResetToken.used_at: now}, synchronize_session=False)

    raw_token = secrets.token_urlsafe(32)
    reset_token = PasswordResetToken(
        user_id=user.id,
        token_hash=_hash_reset_token(raw_token),
        expires_at=now + timedelta(minutes=PASSWORD_RESET_EXPIRE_MINUTES),
    )
    db.add(reset_token)
    db.commit()

    send_password_reset_email(user.email, raw_token)


def reset_password(db: Session, raw_token: str, new_password: str) -> bool:
    now = datetime.now(timezone.utc)
    reset_token = db.query(PasswordResetToken).filter(
        PasswordResetToken.token_hash == _hash_reset_token(raw_token),
        PasswordResetToken.used_at.is_(None),
        PasswordResetToken.expires_at > now,
    ).first()

    if not reset_token:
        return False

    user = db.get(User, reset_token.user_id)
    if not user:
        return False

    try:
        user.password = hash_password(new_password)
        reset_token.used_at = now
        db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.id != reset_token.id,
            PasswordResetToken.used_at.is_(None),
        ).update({PasswordResetToken.used_at: now}, synchronize_session=False)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return True
