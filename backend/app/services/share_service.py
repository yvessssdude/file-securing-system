from sqlalchemy.orm import Session
from app.models.file_permission import FilePermission
from app.models.file import File


def share_file(
    db: Session,
    file_id: int,
    user_id: int,
    owner_id: int,
    permission_type: str = "view",
) -> FilePermission:
    db_file = db.query(File).filter(File.id == file_id, File.owner_id == owner_id).first()
    if not db_file:
        raise ValueError("File not found or you do not own this file")

    existing = db.query(FilePermission).filter(
        FilePermission.file_id == file_id,
        FilePermission.user_id == user_id,
    ).first()
    if existing:
        raise ValueError("File already shared with this user")

    perm = FilePermission(
        file_id=file_id,
        user_id=user_id,
        permission_type=permission_type,
    )
    db.add(perm)
    db.commit()
    db.refresh(perm)
    return perm


def get_shared_files(db: Session, user_id: int) -> list[dict]:
    perms = db.query(FilePermission).filter(FilePermission.user_id == user_id).all()
    from app.models.user import User

    result = []
    for perm in perms:
        db_file = db.query(File).filter(File.id == perm.file_id).first()
        if db_file:
            owner = db.query(User).filter(User.id == db_file.owner_id).first()
            result.append({
                "file_id": db_file.id,
                "filename": db_file.original_filename,
                "shared_by": owner.username if owner else "unknown",
                "permission_type": perm.permission_type,
                "file_size": db_file.file_size,
                "uploaded_at": db_file.uploaded_at,
            })
    return result
