import sys
import os

# Add the current directory (backend) to sys.path so app can be imported
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.auth.password_handler import hash_password

def create_admin():
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if existing_admin:
            if existing_admin.role != "admin":
                existing_admin.role = "admin"
                db.commit()
                print("Updated existing 'admin' user to have admin role.")
            else:
                print("Admin user already exists!")
            return

        # Create new admin
        admin_user = User(
            username="admin",
            email="admin@example.com",
            password_hash=hash_password("Admin!123"),
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        print("Admin user created successfully! Username: admin, Password: Admin!123")
    except Exception as e:
        print(f"Error creating admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin()
