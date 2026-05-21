from sqlalchemy import Column, Integer, String, BigInteger, Boolean, DateTime, ForeignKey, func
from app.database import Base


class File(Base):
    __tablename__ = "Files"

    id = Column(Integer, primary_key=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    original_filename = Column(String(255))
    stored_filename = Column(String(255))
    file_path = Column(String(500))
    mime_type = Column(String(100))
    file_size = Column(BigInteger)
    description = Column(String(500), nullable=True)
    is_public = Column(Boolean, default=False)
    file_password_hash = Column(String(255), nullable=True)
    downloads_count = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
