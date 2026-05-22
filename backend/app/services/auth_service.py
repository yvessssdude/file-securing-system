import re
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.auth.password_handler import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.schemas.auth import UserResponse


def validate_password_strength(password: str) -> None:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"[0-9]", password):
        raise ValueError("Password must contain at least one number")
    if not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password):
        raise ValueError("Password must contain at least one special character")


def register_user(db: Session, username: str, email: str, password: str, request_admin: bool = False) -> User:
    existing = db.query(User).filter(
        (User.username == username) | (User.email == email)
    ).first()
    if existing:
        raise ValueError("Username or email already taken")

    validate_password_strength(password)

    role = "pending_admin" if request_admin else "user"

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        return None

    # Check account lockout status
    if user.locked_until and user.locked_until > datetime.utcnow():
        raise ValueError("Account locked. Try again later.")

    if not verify_password(password, user.password_hash):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)
        db.commit()
        return None

    # Reset failed attempts upon successful login
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()
    return user


def get_user_by_id(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def update_user_profile(db: Session, user_id: int, username: str, email: str) -> User:
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")

    conflict = db.query(User).filter(
        (User.username == username) | (User.email == email),
        User.id != user_id,
    ).first()
    if conflict:
        raise ValueError("Username or email already taken")

    user.username = username
    user.email = email
    db.commit()
    db.refresh(user)
    return user


def change_user_password(db: Session, user_id: int, current_password: str, new_password: str) -> User:
    user = get_user_by_id(db, user_id)
    if not user:
        raise ValueError("User not found")
    if not verify_password(current_password, user.password_hash):
        raise ValueError("Current password is incorrect")

    validate_password_strength(new_password)
    user.password_hash = hash_password(new_password)
    db.commit()
    db.refresh(user)
    return user
