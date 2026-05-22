from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit_log import AuditLog
from app.middleware.auth_middleware import require_admin
from app.models.user import User
from app.models.file import File
from app.schemas.audit import AuditLogResponse
from app.schemas.auth import UserResponse
from app.schemas.file import FileResponse as FileSchema
from app.services import audit_service, file_service
import os

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/logs")
def get_logs(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [AuditLogResponse.model_validate(log) for log in logs]


@router.get("/pending-admins")
def get_pending_admins(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).filter(User.role == "pending_admin").all()
    return [UserResponse.model_validate(u) for u in users]


@router.put("/approve/{user_id}")
def approve_admin(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.role = "admin"
    db.commit()
    audit_service.log_action(db, "ADMIN_APPROVED", current_user.id, target_file_id=user.id)
    return {"message": "User approved as admin"}


@router.get("/users")
def get_users(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.id.desc()).all()
    return [UserResponse.model_validate(u) for u in users]


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    # Optional cascade logic for user's files and audit logs can be placed here, 
    # but SQLAlchemy or DB constraints typically handle this. 
    # For now simply delete the user.
    db.delete(user)
    db.commit()
    audit_service.log_action(db, "USER_DELETED", current_user.id, target_file_id=user.id)
    return {"message": "User deleted"}


@router.get("/files")
def get_all_files(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    files = db.query(File).order_by(File.uploaded_at.desc()).all()
    return [FileSchema.model_validate(f) for f in files]


@router.delete("/files/{file_id}")
def delete_file_as_admin(
    file_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    db_file = db.query(File).filter(File.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    if os.path.exists(db_file.file_path):
        os.remove(db_file.file_path)
    
    db.delete(db_file)
    db.commit()
    audit_service.log_action(db, "FILE_DELETED_BY_ADMIN", current_user.id, file_id)
    return {"message": "File deleted"}
