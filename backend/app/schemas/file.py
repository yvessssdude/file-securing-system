from pydantic import BaseModel, model_validator
from datetime import datetime
from typing import Optional


class FileResponse(BaseModel):
    id: int
    original_filename: str
    stored_filename: str
    mime_type: str
    file_size: int
    description: Optional[str] = None
    is_public: bool
    has_password: bool
    downloads_count: int
    uploaded_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

    @model_validator(mode="before")
    @classmethod
    def compute_has_password(cls, data):
        if hasattr(data, "file_password_hash"):
            data.has_password = data.file_password_hash is not None
        return data


class UpdateFileRequest(BaseModel):
    filename: str
    description: str
    isPublic: bool


class ChangeFilePasswordRequest(BaseModel):
    newPassword: str
    confirmPassword: str


class PublicFileResponse(BaseModel):
    id: int
    filename: str
    uploadedBy: str
    size: float
    type: str
    isPublic: bool
    downloads: int
    uploadedAt: datetime
    password: Optional[str] = None

    class Config:
        from_attributes = True
