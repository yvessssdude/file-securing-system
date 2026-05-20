# CCS6344 Database & Cloud Security Assignment 1
## Secure File Sharing System

---

# 1. Project Overview

## Project Title
Secure File Sharing System

## Objective
Develop a secure web-based file sharing application using a traditional SQL database system (MSSQL) that demonstrates strong database security practices, secure file handling, access control, and protection against internal and external threats.

The system should allow users to:
- Register and login securely
- Upload files
- Share files with authorized users
- Download files securely
- Maintain audit logs
- Enforce role-based access control (RBAC)

---

# 2. Assignment Scope

This project focuses heavily on:
- Database security
- SQL security implementation
- Threat modeling
- PDPA compliance
- Secure architecture design
- Security testing

The system should prioritize:
- Security quality
- Proper architecture
- Clear documentation
- Screenshots and implementation evidence

DO NOT overbuild unnecessary features.

---

# 3. Finalized Tech Stack

## Frontend
- Next.js
- TypeScript
- TailwindCSS
- shadcn/ui

## Backend
- FastAPI
- Python 3.12+

## Database
- Microsoft SQL Server (MSSQL)

## ORM / Database Layer
- SQLAlchemy
- Alembic (optional for migrations)

## Authentication
- JWT Authentication
- bcrypt password hashing

## Validation
- Pydantic

## Reverse Proxy
- Nginx

## Deployment
- Debian Linux Server

## File Storage
- Private local storage directory
- NOT public directory
- NOT stored inside MSSQL database

---

# 4. Proposed System Architecture

```text
Next.js Frontend
        ↓ HTTPS
FastAPI Backend API
        ↓
MSSQL Database
        ↓
Private File Storage
```

### Important Architecture Notes
- Next.js frontend MUST NOT connect directly to MSSQL.
- All database interactions should go through FastAPI.
- Backend is responsible for:
    - authentication
    - authorization
    - file validation
    - logging
    - database security

# 5. Core Features

## Authentication System
- User registration
- User login
- JWT authentication
- Password hashing with bcrypt
- Logout functionality

## File Management
- Upload file
- Download file
- Delete file
- View uploaded files

## File Sharing
- Share file with another user
- Permission-based access

## User Roles

### Admin
- Manage users
- View logs
- Monitor system activity

### User
- Upload own files
- Access own/shared files only

## Audit Logging
Track:
- login attempts
- uploads
- downloads
- deletions
- permission changes
- failed access attempts

---

# 6. Recommended Database Design

## Users Table

```sql
CREATE TABLE Users (
    id INT PRIMARY KEY IDENTITY(1,1),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT GETDATE()
);
```

## Files Table

```sql
CREATE TABLE Files (
    id INT PRIMARY KEY IDENTITY(1,1),
    owner_id INT NOT NULL,
    original_filename VARCHAR(255),
    stored_filename VARCHAR(255),
    file_path VARCHAR(500),
    mime_type VARCHAR(100),
    file_size BIGINT,
    uploaded_at DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (owner_id) REFERENCES Users(id)
);
```

## FilePermissions Table

```sql
CREATE TABLE FilePermissions (
    id INT PRIMARY KEY IDENTITY(1,1),
    file_id INT NOT NULL,
    user_id INT NOT NULL,
    permission_type VARCHAR(20),

    FOREIGN KEY (file_id) REFERENCES Files(id),
    FOREIGN KEY (user_id) REFERENCES Users(id)
);
```

## AuditLogs Table

```sql
CREATE TABLE AuditLogs (
    id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT,
    action VARCHAR(255),
    target_file_id INT,
    ip_address VARCHAR(100),
    timestamp DATETIME DEFAULT GETDATE(),

    FOREIGN KEY (user_id) REFERENCES Users(id)
);
```

---

# 7. Security Requirements

## Mandatory Security Features

### 1. Password Hashing
- Use bcrypt
- NEVER store plaintext passwords

### 2. JWT Authentication
- Secure login sessions
- Token expiration
- Protected API endpoints

### 3. SQL Injection Protection
- Use SQLAlchemy ORM
- Parameterized queries only

### 4. Role-Based Access Control (RBAC)
- Separate admin/user permissions
- Prevent unauthorized access

### 5. File Access Authorization
Before file download:
- verify ownership
OR
- verify sharing permission

### 6. File Upload Validation
Validate:
- file size
- MIME type
- allowed extensions

Reject dangerous files:
- `.exe`
- `.sh`
- `.bat`
- `.php`

### 7. Secure File Storage

Store files in:

```text
/srv/private_uploads
```

NOT:

```text
/public/uploads
```

Files should only be accessible through authenticated API routes.

### 8. HTTPS/TLS
- Use Nginx reverse proxy
- Enable HTTPS

### 9. Audit Logging
Record:
- uploads
- downloads
- failed logins
- deletions
- permission changes

### 10. Rate Limiting
Protect:
- login endpoint
- upload endpoint

Prevent:
- brute force attacks
- abuse

---

# 8. Recommended API Endpoints

## Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | /auth/register | Register user |
| POST | /auth/login | Login |
| GET | /auth/me | Current user |

## Files

| Method | Endpoint | Description |
|---|---|---|
| POST | /files/upload | Upload file |
| GET | /files | List files |
| GET | /files/{id} | Download file |
| DELETE | /files/{id} | Delete file |

## Sharing

| Method | Endpoint | Description |
|---|---|---|
| POST | /share | Share file |
| GET | /shared | Shared files |

## Logs

| Method | Endpoint | Description |
|---|---|---|
| GET | /admin/logs | View audit logs |

---

# 9. Threat Modeling Planning

## STRIDE Mapping

| Threat | Example |
|---|---|
| Spoofing | Stolen JWT |
| Tampering | File modification |
| Repudiation | User denies upload |
| Information Disclosure | Unauthorized file access |
| Denial of Service | Upload flooding |
| Elevation of Privilege | User becomes admin |

## DREAD Evaluation

Need to evaluate:
- Damage
- Reproducibility
- Exploitability
- Affected Users
- Discoverability

---

# 10. PDPA 2010 Planning

## Relevant Roles

| Role | Description |
|---|---|
| Data Subject | System users |
| Data User | Company/admin |
| Data Processor | Backend system |
| System Administrator | Server administrator |

## PDPA Compliance Areas
- Access control
- Data protection
- Secure storage
- Auditability
- Data retention
- Consent

---

# 11. Suggested Project Structure

```text
project-root/
│
├── frontend/
│   ├── nextjs-app
│
├── backend/
│   ├── app/
│   ├── routes/
│   ├── models/
│   ├── services/
│   ├── middleware/
│   ├── auth/
│   └── main.py
│
├── uploads/
│
├── nginx/
│
├── docs/
│
└── README.md
```

---

# 12. Development Plan

## Day 1

### Backend
- MSSQL setup
- FastAPI setup
- JWT auth
- upload API
- database schema

### Frontend
- login page
- dashboard
- upload page

## Day 2

### Security Features
- RBAC
- audit logs
- validation
- rate limiting
- HTTPS

### Documentation
- screenshots
- STRIDE/DREAD
- PDPA discussion
- report writing

---

# 13. Screenshots Required For Report

## Must Capture
- MSSQL setup
- database schema
- login page
- upload success
- download success
- file sharing
- RBAC restriction
- failed login
- rejected file upload
- audit logs
- HTTPS
- security testing

---

# 14. Important Notes

## DO NOT
- store plaintext passwords
- expose uploads publicly
- connect frontend directly to MSSQL
- hardcode secrets
- store files inside MSSQL database

## MUST
- use environment variables
- implement authentication
- implement authorization
- implement audit logging
- use prepared queries/ORM
- validate uploaded files

---

# 15. Final Goal

The project should demonstrate:
- secure database implementation
- secure file handling
- SQL security techniques
- internal and external threat protection
- practical database security knowledge

The focus is:

```text
SECURITY FIRST, FEATURES SECOND
```
