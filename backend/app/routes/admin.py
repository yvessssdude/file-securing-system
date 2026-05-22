from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.audit_log import AuditLog
from app.middleware.auth_middleware import require_admin
from app.models.user import User
from app.schemas.audit import AuditLogResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/logs")
def get_logs(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()
    return [AuditLogResponse.model_validate(log) for log in logs]
