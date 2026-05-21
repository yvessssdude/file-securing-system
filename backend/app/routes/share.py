from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import share_service, audit_service
from app.middleware.auth_middleware import get_current_user
from app.models.user import User
from app.schemas.share import ShareRequest, ShareResponse

router = APIRouter(tags=["Sharing"])


@router.post("/share")
def share_file(
    body: ShareRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    request: Request = None,
):
    try:
        perm = share_service.share_file(db, body.file_id, body.user_id, current_user.id, body.permission_type)
        audit_service.log_action(
            db, "FILE_SHARED", current_user.id, body.file_id, request.client.host,
        )
        return ShareResponse.model_validate(perm)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/shared")
def list_shared_files(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return share_service.get_shared_files(db, current_user.id)
