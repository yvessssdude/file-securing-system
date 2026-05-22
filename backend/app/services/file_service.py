import os
import uuid
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.models.file import File
from app.models.file_permission import FilePermission
from app.config import get_settings
from app.auth.password_handler import hash_password, verify_password

settings = get_settings()

ALLOWED_EXTENSIONS = {".txt", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx", ".png", ".jpg", ".jpeg", ".gif", ".csv", ".json", ".zip", ".md"}
DANGEROUS_EXTENSIONS = {".exe", ".sh", ".bat", ".php", ".msi", ".cmd", ".vbs", ".ps1"}

MAGIC_SIGNATURES = {
    ".pdf": [b"%PDF"],
    ".png": [b"\x89PNG\r\n\x1a\n"],
    ".jpg": [b"\xff\xd8\xff"],
    ".jpeg": [b"\xff\xd8\xff"],
    ".gif": [b"GIF8"],
    ".zip": [b"PK\x03\x04"],
    ".docx": [b"PK\x03\x04"],
    ".xlsx": [b"PK\x03\x04"],
    ".pptx": [b"PK\x03\x04"],
}

BANNED_MAGIC = {
    b"MZ": "Windows Executable/DLL",
    b"\x7fELF": "Linux Executable/Shared Object",
}


def validate_file(file: UploadFile) -> None:
    ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""

    if ext in DANGEROUS_EXTENSIONS:
        raise ValueError(f"File type '{ext}' is not allowed")

    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"File type '{ext}' is not supported")

    # Verify binary magic bytes to prevent extension spoofing
    file.file.seek(0)
    header = file.file.read(16)
    file.file.seek(0)

    # Check for banned binary executables
    for banned, name in BANNED_MAGIC.items():
        if header.startswith(banned):
            raise ValueError(f"Dangerous file signature detected: {name} is not allowed")

    # Cross-reference extension with expected magic bytes
    if ext in MAGIC_SIGNATURES:
        valid_signature = False
        for sig in MAGIC_SIGNATURES[ext]:
            if header.startswith(sig):
                valid_signature = True
                break
        if not valid_signature:
            raise ValueError(f"File content signature mismatch for extension '{ext}'")

    max_bytes = settings.MAX_FILE_SIZE_MB * 1024 * 1024
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > max_bytes:
        raise ValueError(f"File exceeds maximum size of {settings.MAX_FILE_SIZE_MB}MB")


def upload_file(
    db: Session,
    user_id: int,
    file: UploadFile,
    filename: str,
    description: str | None = None,
    is_public: bool = False,
    file_password: str | None = None,
) -> File:
    if not is_public and not file_password:
        raise ValueError("Password is required for private files")

    validate_file(file)

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)

    stored_filename = f"{uuid.uuid4()}_{filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, stored_filename)

    content = file.file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    file_size = len(content)

    db_file = File(
        owner_id=user_id,
        original_filename=filename,
        stored_filename=stored_filename,
        file_path=file_path,
        mime_type=file.content_type or "application/octet-stream",
        file_size=file_size,
        description=description,
        is_public=is_public,
        file_password_hash=hash_password(file_password) if file_password else None,
    )
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    return db_file


def get_user_files(db: Session, user_id: int) -> list[File]:
    return db.query(File).filter(File.owner_id == user_id).order_by(File.uploaded_at.desc()).all()


def get_file_by_id(db: Session, file_id: int) -> File | None:
    return db.query(File).filter(File.id == file_id).first()


def update_file(
    db: Session,
    file_id: int,
    user_id: int,
    filename: str,
    description: str,
    is_public: bool,
) -> File:
    db_file = get_file_by_id(db, file_id)
    if not db_file or db_file.owner_id != user_id:
        raise ValueError("File not found or access denied")

    if not is_public and not db_file.file_password_hash:
        raise ValueError("Set a password first before making the file private")

    db_file.original_filename = filename
    db_file.description = description
    db_file.is_public = is_public
    db.commit()
    db.refresh(db_file)
    return db_file


def change_file_password(
    db: Session,
    file_id: int,
    user_id: int,
    new_password: str,
) -> File:
    db_file = get_file_by_id(db, file_id)
    if not db_file or db_file.owner_id != user_id:
        raise ValueError("File not found or access denied")

    if not new_password and not db_file.is_public:
        raise ValueError("Private files must have a password")

    db_file.file_password_hash = hash_password(new_password) if new_password else None
    db.commit()
    db.refresh(db_file)
    return db_file


def delete_file(db: Session, file_id: int, user_id: int) -> None:
    db_file = get_file_by_id(db, file_id)
    if not db_file or db_file.owner_id != user_id:
        raise ValueError("File not found or access denied")

    if os.path.exists(db_file.file_path):
        os.remove(db_file.file_path)

    db.query(FilePermission).filter(FilePermission.file_id == file_id).delete()
    db.delete(db_file)
    db.commit()


def get_public_files(
    db: Session,
    search: str = "",
    sort: str = "downloads",
    page: int = 1,
    per_page: int = 10,
) -> tuple[list[dict], int]:
    query = db.query(File)

    if search:
        query = query.filter(File.original_filename.ilike(f"%{search}%"))

    total = query.count()

    if sort == "downloads":
        query = query.order_by(File.downloads_count.desc())
    elif sort == "date":
        query = query.order_by(File.uploaded_at.desc())
    elif sort == "size":
        query = query.order_by(File.file_size.desc())

    offset = (page - 1) * per_page
    files = query.offset(offset).limit(per_page).all()

    from app.models.user import User
    result = []
    for f in files:
        owner = db.query(User).filter(User.id == f.owner_id).first()
        result.append({
            "id": f.id,
            "filename": f.original_filename,
            "uploadedBy": owner.username if owner else "unknown",
            "size": round(f.file_size / (1024 * 1024), 2) if f.file_size else 0,
            "type": os.path.splitext(f.original_filename)[1].lstrip(".") if f.original_filename else "",
            "isPublic": f.is_public,
            "downloads": f.downloads_count or 0,
            "uploadedAt": f.uploaded_at,
            "password": "required" if f.file_password_hash else None,
        })

    return result, total


def verify_file_password(db: Session, file_id: int, password: str) -> bool:
    db_file = get_file_by_id(db, file_id)
    if not db_file or not db_file.file_password_hash:
        return False
    return verify_password(password, db_file.file_password_hash)


def increment_download_count(db: Session, file_id: int) -> None:
    db_file = get_file_by_id(db, file_id)
    if db_file:
        db_file.downloads_count = (db_file.downloads_count or 0) + 1
        db.commit()


def can_access_file(db: Session, file_id: int, user_id: int) -> bool:
    db_file = get_file_by_id(db, file_id)
    if not db_file:
        return False
    if db_file.owner_id == user_id:
        return True
    # Check if this file was explicitly shared with the requesting user
    perm = db.query(FilePermission).filter(
        FilePermission.file_id == file_id,
        FilePermission.user_id == user_id,
    ).first()
    return perm is not None
