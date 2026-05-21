import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.services import file_service, audit_service
from app.middleware.auth_middleware import get_current_user
from app.middleware.rate_limit import limiter
from app.models.user import User
from app.models.file import File as FileModel
from app.schemas.file import FileResponse, UpdateFileRequest, ChangeFilePasswordRequest

router = APIRouter(prefix="/files", tags=["Files"])


@router.post("/upload")
@limiter.limit("20/minute")
def upload(
    request: Request,
    file: UploadFile = File(...),
    filename: str = Form(...),
    description: Optional[str] = Form(None),
    isPublic: bool = Form(False),
    filePassword: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        db_file = file_service.upload_file(
            db, current_user.id, file, filename, description, isPublic, filePassword,
        )
        audit_service.log_action(
            db, "FILE_UPLOADED", current_user.id, db_file.id, request.client.host,
        )
        return FileResponse.model_validate(db_file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("")
def list_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    files = file_service.get_user_files(db, current_user.id)
    return [FileResponse.model_validate(f) for f in files]


@router.get("/{file_id}")
def get_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_file = file_service.get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    if not file_service.can_access_file(db, file_id, current_user.id):
        raise HTTPException(status_code=403, detail="Access denied")

    return FileResponse.model_validate(db_file)


@router.put("/{file_id}")
def update_file(
    file_id: int,
    body: UpdateFileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        db_file = file_service.update_file(
            db, file_id, current_user.id, body.filename, body.description, body.isPublic,
        )
        audit_service.log_action(db, "FILE_UPDATED", current_user.id, file_id)
        return FileResponse.model_validate(db_file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{file_id}/password")
def change_file_password(
    file_id: int,
    body: ChangeFilePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.newPassword != body.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    try:
        db_file = file_service.change_file_password(db, file_id, current_user.id, body.newPassword)
        audit_service.log_action(db, "FILE_PASSWORD_CHANGED", current_user.id, file_id)
        return {"message": "Password updated successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/{file_id}")
def delete_file(
    file_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None,
):
    try:
        file_service.delete_file(db, file_id, current_user.id)
        audit_service.log_action(db, "FILE_DELETED", current_user.id, file_id, request.client.host)
        return {"message": "File deleted successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{file_id}/download")
def download_file(
    file_id: int,
    password: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    db_file = file_service.get_file_by_id(db, file_id)
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")

    if db_file.file_password_hash:
        if db_file.owner_id != current_user.id:
            if not password:
                raise HTTPException(status_code=401, detail="Password required")
            if not file_service.verify_file_password(db, file_id, password):
                raise HTTPException(status_code=403, detail="Incorrect password")
        else:
            if password and not file_service.verify_file_password(db, file_id, password):
                raise HTTPException(status_code=403, detail="Incorrect password")

    if not os.path.exists(db_file.file_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    file_service.increment_download_count(db, file_id)
    audit_service.log_action(db, "FILE_DOWNLOADED", current_user.id, file_id)

    return FileResponse(
        path=db_file.file_path,
        filename=db_file.original_filename,
        media_type=db_file.mime_type or "application/octet-stream",
    )


@router.get("/public/list")
def list_public_files(
    search: str = Query(""),
    sort: str = Query("downloads"),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db),
):
    files, total = file_service.get_public_files(db, search, sort, page, per_page)
    return {
        "files": files,
        "total": total,
        "page": page,
        "per_page": per_page,
    }
