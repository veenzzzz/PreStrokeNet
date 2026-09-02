from datetime import datetime
from pydantic import BaseModel, ConfigDict

class NotificationBase(BaseModel):
    patient_id: str | None = None
    prediction_id: int | None = None
    type: str
    severity: str = "info"
    title: str
    message: str

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    is_read: bool
    created_at: datetime
    read_at: datetime | None = None

class NotificationUnreadCountResponse(BaseModel):
    count: int

class NotificationListResponse(BaseModel):
    total: int
    unread_count: int
    items: list[NotificationResponse]
