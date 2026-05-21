from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class FilePermission(Base):
    __tablename__ = "FilePermissions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    file_id = Column(Integer, ForeignKey("Files.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("Users.id"), nullable=False)
    permission_type = Column(String(20))
