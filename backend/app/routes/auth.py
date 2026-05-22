from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import auth_service, audit_service
from app.middleware.auth_middleware import get_current_user
from app.middleware.rate_limit import limiter
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    LoginResponse,
    UserResponse,
    UpdateProfileRequest,
    ChangePasswordRequest,
)
from app.auth.jwt_handler import create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register")
@limiter.limit("50/minute")
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.register_user(db, body.username, body.email, body.password, body.request_admin)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    token = create_access_token({"sub": str(user.id), "role": user.role})
    audit_service.log_action(db, "USER_REGISTERED", user.id, ip_address=request.client.host)

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.post("/login")
@limiter.limit("100/minute")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = auth_service.authenticate_user(db, body.username, body.password)
    except ValueError as e:
        audit_service.log_action(db, "LOGIN_FAILED_LOCKED", ip_address=request.client.host)
        raise HTTPException(status_code=400, detail=str(e))

    if not user:
        audit_service.log_action(db, "LOGIN_FAILED", ip_address=request.client.host)
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": str(user.id), "role": user.role})
    audit_service.log_action(db, "LOGIN_SUCCESS", user.id, ip_address=request.client.host)

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)


@router.put("/me", response_model=UserResponse)
def update_profile(
    body: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        user = auth_service.update_user_profile(db, current_user.id, body.username, body.email)
        audit_service.log_action(db, "PROFILE_UPDATED", current_user.id)
        return UserResponse.model_validate(user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/change-password")
def change_password(
    body: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        auth_service.change_user_password(db, current_user.id, body.currentPassword, body.newPassword)
        audit_service.log_action(db, "PASSWORD_CHANGED", current_user.id)
        return {"message": "Password changed successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
