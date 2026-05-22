import time
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy import exc as sa_exc

from app.database import engine, Base
from app.middleware.rate_limit import limiter
from app.routes import auth, files, share, admin


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
