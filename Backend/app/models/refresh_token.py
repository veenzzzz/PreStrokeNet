from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func

from app.core.database import Base


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    # Do not cascade from users on SQL Server. The auth service removes a user's
    # refresh rows before deletion to avoid a cascade path through replaced_by_id.
    user_id = Column(Integer, ForeignKey("users.id", ondelete="NO ACTION"), nullable=False, index=True)
    token_hash = Column(String(128), nullable=False, unique=True, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False, index=True)
    revoked_at = Column(DateTime(timezone=True), nullable=True)
    # Replacement links are application-managed; SQL Server disallows a
    # self-referencing SET NULL cascade on this table.
    replaced_by_id = Column(Integer, ForeignKey("refresh_tokens.id", ondelete="NO ACTION"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    @property
    def is_active(self) -> bool:
        from datetime import datetime, timezone

        expires_at = self.expires_at
        if expires_at is None:
            return False
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        return self.revoked_at is None and expires_at > datetime.now(timezone.utc)
