from pydantic import BaseModel
from typing import Optional


class ShareRequest(BaseModel):
    file_id: int
    user_id: int
    permission_type: Optional[str] = "view"


class ShareResponse(BaseModel):
    id: int
    file_id: int
    user_id: int
    permission_type: str

    class Config:
        from_attributes = True
