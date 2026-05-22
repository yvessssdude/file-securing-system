from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog


def log_action(
    db: Session,
    action: str,
    user_id: int | None = None,
    target_file_id: int | None = None,
    ip_address: str | None = None,
) -> AuditLog:
    log = AuditLog(
        user_id=user_id,
        action=action,
        target_file_id=target_file_id,
        ip_address=ip_address or "unknown",
    )
    db.add(log)
    db.commit()
    return log
