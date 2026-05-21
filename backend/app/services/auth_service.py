from sqlalchemy.orm import Session
from app.models.user import User
from app.auth.password_handler import hash_password, verify_password
from app.auth.jwt_handler import create_access_token
from app.schemas.auth import UserResponse


def register_user(db: Session, username: str, email: str, password: str) -> User:
    existing = db.query(User).filter(
        (User.username == username) | (User.email == email)
    ).first()
    if existing:
        raise ValueError("Username or email already taken")

    user = User(
        username=username,
        email=email,
        password_hash=hash_password(password),
        role="user",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, username: str, password: str) -> User | None:
    user = db.query(User).filter(User.username == username).first()
    if not user or not verify_password(password, user.password_hash):
        return None
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

    user.password_hash = hash_password(new_password)
    db.commit()
    db.refresh(user)
    return user
