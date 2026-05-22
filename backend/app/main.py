import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import exc as sa_exc

from app.database import engine, Base, SessionLocal
from app.middleware.rate_limit import limiter
from app.routes import auth, files, share, admin


def seed_admin():
    """Create a default admin account on first boot if none exists."""
    from app.models.user import User
    from app.auth.password_handler import hash_password

    db = SessionLocal()
    try:
        exists = db.query(User).filter(User.role == "admin").first()
        if not exists:
            admin_user = User(
                username="admin",
                email="admin@bean.local",
                password_hash=hash_password("Admin!123"),
                role="admin",
            )
            db.add(admin_user)
            db.commit()
            print("✅ Default admin account created: admin / Admin!123")
        else:
            print("ℹ️  Admin account already exists, skipping seed.")
    except Exception as e:
        print(f"⚠️  Could not seed admin: {e}")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    for i in range(30):
        try:
            Base.metadata.create_all(bind=engine)
            break
        except sa_exc.OperationalError:
            if i >= 29:
                raise
            time.sleep(2)
    seed_admin()
    yield


app = FastAPI(
    title="Secure File Sharing System",
    description="CCS6344 Database & Cloud Security - Assignment 1",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(share.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/setup")
def setup_admin():
    """One-time setup endpoint: creates admin account if none exists."""
    from app.models.user import User
    from app.auth.password_handler import hash_password

    db = SessionLocal()
    try:
        exists = db.query(User).filter(User.role == "admin").first()
        if exists:
            return {"message": "Admin already exists", "username": exists.username}

        admin_user = User(
            username="admin",
            email="admin@bean.local",
            password_hash=hash_password("Admin!123"),
            role="admin",
        )
        db.add(admin_user)
        db.commit()
        return {"message": "Admin account created", "username": "admin", "password": "Admin!123"}
    except Exception as e:
        return {"error": str(e)}
    finally:
        db.close()
