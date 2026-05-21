from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    target_file_id: Optional[int] = None
    ip_address: str
    timestamp: datetime

    class Config:
        from_attributes = True
