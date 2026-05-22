from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from app.database import Base


class AuditLog(Base):
    __tablename__ = "AuditLogs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=True)
    action = Column(String(255))
    target_file_id = Column(Integer, nullable=True)
    ip_address = Column(String(100))
    timestamp = Column(DateTime, default=func.now())
