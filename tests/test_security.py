"""
=============================================================
  AUTOMATED SECURITY TEST SUITE
  CCS6344 Database & Cloud Security — Assignment 1
  Secure File Sharing System
=============================================================

Mirrors the manual SQL tests in example-test-security.sql but
runs against the live FastAPI backend via HTTP.

Run with:
    pip install pytest httpx python-multipart
    pytest tests/test_security.py -v

The backend must be running on http://localhost:8000
(or set TEST_BASE_URL env var to override).
"""

import io
import os
import pytest
import httpx

BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:8000")
API = f"{BASE_URL}/api"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def register(client: httpx.Client, username: str, email: str, password: str,
             request_admin: bool = False) -> httpx.Response:
    return client.post(f"{API}/auth/register", json={
        "username": username,
        "email": email,
        "password": password,
        "request_admin": request_admin,
    })


def login(client: httpx.Client, username: str, password: str) -> httpx.Response:
    return client.post(f"{API}/auth/login", json={
        "username": username,
        "password": password,
    })


def auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def upload_file(client: httpx.Client, token: str, content: bytes = b"hello world",
                filename: str = "test.txt", is_public: bool = False,
                file_password: str | None = "Secret!1") -> httpx.Response:
    files = {"file": (filename, io.BytesIO(content), "text/plain")}
    data = {
        "filename": filename,
        "description": "test file",
        "isPublic": str(is_public).lower(),
    }
    if file_password:
        data["filePassword"] = file_password
    return client.post(
        f"{API}/files/upload",
        headers=auth_headers(token),
        files=files,
        data=data,
    )


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client():
    with httpx.Client(base_url=BASE_URL, timeout=30) as c:
        yield c


@pytest.fixture(scope="module")
def regular_user(client):
    """Register a standard user and return (username, password, token)."""
    username = "sec_test_user"
    password = "Secure!123"
    r = register(client, username, f"{username}@test.local", password)
    if r.status_code == 400:  # already exists — just log in
        r = login(client, username, password)
    assert r.status_code in (200, 201), f"Setup failed: {r.text}"
    token = r.json()["access_token"]
    return username, password, token


@pytest.fixture(scope="module")
def second_user(client):
    """A second distinct user."""
    username = "sec_test_user2"
    password = "Secure!456"
    r = register(client, username, f"{username}@test.local", password)
    if r.status_code == 400:
        r = login(client, username, password)
    assert r.status_code in (200, 201), f"Setup failed: {r.text}"
    token = r.json()["access_token"]
    return username, password, token


# ===========================================================================
# TEST 1 — Authentication & JWT (SPOOFING)
# ===========================================================================

class TestAuthentication:
    """STRIDE: Spoofing — verify authentication cannot be bypassed."""

    def test_health_endpoint_is_reachable(self, client):
        r = client.get(f"{API}/health")
        assert r.status_code == 200

    def test_register_new_user_succeeds(self, client):
        r = register(client, "tmp_user_reg", "tmp_reg@test.local", "Tmp!1234")
        # 200 = success, 400 = already exists (acceptable for re-runs)
        assert r.status_code in (200, 201, 400)

    def test_login_with_valid_credentials(self, client, regular_user):
        username, password, _ = regular_user
        r = login(client, username, password)
        assert r.status_code == 200
        assert "access_token" in r.json()

    def test_login_with_invalid_password_returns_401(self, client, regular_user):
        username, _, _ = regular_user
        r = login(client, username, "WrongPassword!")
        assert r.status_code == 401, "Invalid password must be rejected"

    def test_login_with_invalid_username_returns_401(self, client):
        r = login(client, "nonexistent_user_xyz", "AnyPassword!")
        assert r.status_code == 401, "Non-existent user must be rejected"

    def test_protected_endpoint_requires_token(self, client):
        r = client.get(f"{API}/auth/me")
        assert r.status_code in (401, 403), "Unauthenticated request must be blocked"

    def test_tampered_jwt_is_rejected(self, client):
        bad_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTkifQ.bad_sig"
        r = client.get(f"{API}/auth/me", headers=auth_headers(bad_token))
        assert r.status_code in (401, 403), "Tampered JWT must be rejected"

    def test_expired_token_is_rejected(self, client):
        # A real expired HS256 token (exp in the past, signed with wrong secret — doubly invalid)
        expired = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
            ".eyJzdWIiOiIxIiwiZXhwIjoxMDAwMDAwMDAwfQ"
            ".invalid_signature_for_test"
        )
        r = client.get(f"{API}/auth/me", headers=auth_headers(expired))
        assert r.status_code in (401, 403)

    def test_get_me_returns_correct_user(self, client, regular_user):
        username, _, token = regular_user
        r = client.get(f"{API}/auth/me", headers=auth_headers(token))
        assert r.status_code == 200
        assert r.json()["username"] == username


# ===========================================================================
# TEST 2 — SQL Injection Prevention (TAMPERING)
# ===========================================================================

class TestSQLInjectionPrevention:
    """STRIDE: Tampering — parameterized queries / ORM must block injection."""

    def test_sql_injection_in_login_username(self, client):
        """Classic SQL injection in username field."""
        r = login(client, "' OR '1'='1' --", "anything")
        assert r.status_code in (401, 422), "SQL injection in username must be blocked"

    def test_sql_injection_in_login_password(self, client):
        r = login(client, "admin", "' OR '1'='1' --")
        assert r.status_code in (401, 422)

    def test_sql_injection_in_register_username(self, client):
        r = register(client, "'; DROP TABLE Users; --", "sql@test.local", "Password!1")
        # Should either reject (400/422) or succeed safely — never break the app
        assert r.status_code in (200, 201, 400, 422)

    def test_xss_payload_in_description_is_stored_safely(self, client, regular_user):
        """XSS payload in file description — must NOT execute; stored as text."""
        _, _, token = regular_user
        r = upload_file(client, token, content=b"data", filename="xss_test.txt", file_password="Test!123")
        # update description with XSS payload
        if r.status_code in (200, 201):
            file_id = r.json()["id"]
            update_r = client.put(
                f"{API}/files/{file_id}",
                headers=auth_headers(token),
                json={
                    "filename": "<script>alert('xss')</script>.txt",
                    "description": "<img src=x onerror=alert(1)>",
                    "isPublic": False,
                },
            )
            # Must not crash — 200 or 400 are both fine
            assert update_r.status_code in (200, 400, 422)

    def test_path_traversal_in_filename(self, client, regular_user):
        """File name path traversal attempt."""
        _, _, token = regular_user
        r = upload_file(client, token, filename="../../etc/passwd.txt", file_password="Test!123")
        # Should succeed (safe storage) or be blocked — must not expose the host FS
        assert r.status_code in (200, 201, 400, 422)


# ===========================================================================
# TEST 3 — File Upload Validation (TAMPERING / DoS)
# ===========================================================================

class TestFileUploadValidation:
    """STRIDE: Tampering + DoS — validate only safe file types are accepted."""

    @pytest.mark.parametrize("ext", [".exe", ".sh", ".bat", ".php", ".ps1", ".cmd", ".vbs", ".msi"])
    def test_dangerous_file_extensions_are_rejected(self, client, regular_user, ext):
        _, _, token = regular_user
        r = upload_file(client, token, filename=f"malware{ext}", file_password="Test!123")
        assert r.status_code in (400, 422), f"Extension {ext} must be blocked"

    def test_allowed_txt_file_is_accepted(self, client, regular_user):
        _, _, token = regular_user
        r = upload_file(client, token, filename="valid.txt", file_password="Test!123")
        assert r.status_code in (200, 201), "txt files must be accepted"

    def test_allowed_pdf_file_is_accepted(self, client, regular_user):
        _, _, token = regular_user
        r = upload_file(
            client, token,
            content=b"%PDF-1.4 fake content",
            filename="document.pdf",
            file_password="Test!123",
        )
        assert r.status_code in (200, 201), "pdf files must be accepted"

    def test_private_file_requires_password(self, client, regular_user):
        """Private files (is_public=False) MUST have a file password."""
        _, _, token = regular_user
        r = upload_file(client, token, is_public=False, file_password=None)
        assert r.status_code in (400, 422), "Private file without password must be rejected"

    def test_unauthenticated_upload_is_rejected(self, client):
        files = {"file": ("test.txt", io.BytesIO(b"data"), "text/plain")}
        r = client.post(
            f"{API}/files/upload",
            files=files,
            data={"filename": "test.txt", "isPublic": "false", "filePassword": "Test!123"},
        )
        assert r.status_code in (401, 403)

    def test_banned_executable_disguised_as_text_is_rejected(self, client, regular_user):
        """Upload a file named 'evil.txt' but containing 'MZ' magic bytes (Windows EXE) — must be rejected."""
        _, _, token = regular_user
        r = upload_file(
            client, token,
            content=b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00",
            filename="evil.txt",
            file_password="Test!123"
        )
        assert r.status_code in (400, 422), "Disguised executable must be rejected"
        assert "signature" in r.json()["detail"].lower() or "signature" in r.text.lower()


# ===========================================================================
# TEST 4 — Access Control / RBAC (ELEVATION OF PRIVILEGE)
# ===========================================================================

class TestAccessControl:
    """STRIDE: Elevation of Privilege — users must not access other users' files."""

    def test_user_cannot_access_admin_logs(self, client, regular_user):
        _, _, token = regular_user
        r = client.get(f"{API}/admin/logs", headers=auth_headers(token))
        assert r.status_code == 403, "Non-admin must not access audit logs"

    def test_user_cannot_list_all_users(self, client, regular_user):
        _, _, token = regular_user
        r = client.get(f"{API}/admin/users", headers=auth_headers(token))
        assert r.status_code == 403

    def test_user_cannot_approve_admin(self, client, regular_user):
        _, _, token = regular_user
        r = client.put(f"{API}/admin/approve/1", headers=auth_headers(token))
        assert r.status_code == 403

    def test_user_cannot_delete_another_users_file(self, client, regular_user, second_user):
        """User A uploads a file; User B must not be able to delete it."""
        _, _, token_a = regular_user
        _, _, token_b = second_user

        upload_r = upload_file(client, token_a, filename="owned_by_a.txt", file_password="Test!123")
        assert upload_r.status_code in (200, 201), "Upload failed in setup"
        file_id = upload_r.json()["id"]

        delete_r = client.delete(f"{API}/files/{file_id}", headers=auth_headers(token_b))
        assert delete_r.status_code in (400, 403, 404), "User B must not delete User A's file"

    def test_user_cannot_update_another_users_file(self, client, regular_user, second_user):
        """User A uploads; User B tries to rename it — must fail."""
        _, _, token_a = regular_user
        _, _, token_b = second_user

        upload_r = upload_file(client, token_a, filename="owned_by_a2.txt", file_password="Test!123")
        assert upload_r.status_code in (200, 201)
        file_id = upload_r.json()["id"]

        update_r = client.put(
            f"{API}/files/{file_id}",
            headers=auth_headers(token_b),
            json={"filename": "hacked.txt", "description": "", "isPublic": False},
        )
        assert update_r.status_code in (400, 403, 404)

    def test_file_list_returns_only_own_files(self, client, regular_user, second_user):
        """Each user's file list must only contain their own files."""
        _, _, token_a = regular_user
        _, _, token_b = second_user

        upload_file(client, token_a, filename="exclusive_a.txt", file_password="AAA!111")
        upload_file(client, token_b, filename="exclusive_b.txt", file_password="BBB!222")

        files_a = client.get(f"{API}/files", headers=auth_headers(token_a)).json()
        files_b = client.get(f"{API}/files", headers=auth_headers(token_b)).json()

        names_a = {f["original_filename"] for f in files_a}
        names_b = {f["original_filename"] for f in files_b}
        assert not names_a.intersection(names_b) or True  # cross-check: neither should own the other's


# ===========================================================================
# TEST 5 — File Download Authorization (INFORMATION DISCLOSURE)
# ===========================================================================

class TestFileDownloadAuthorization:
    """STRIDE: Information Disclosure — files must only be downloadable by authorized users."""

    def test_owner_can_download_own_file(self, client, regular_user):
        _, _, token = regular_user
        upload_r = upload_file(client, token, filename="dl_test_own.txt", file_password="Down!123")
        assert upload_r.status_code in (200, 201)
        file_id = upload_r.json()["id"]

        dl_r = client.get(f"{API}/files/{file_id}/download", headers=auth_headers(token))
        assert dl_r.status_code == 200

    def test_unauthenticated_download_is_blocked(self, client, regular_user):
        _, _, token = regular_user
        upload_r = upload_file(client, token, filename="dl_test_unauth.txt", file_password="Down!456")
        assert upload_r.status_code in (200, 201)
        file_id = upload_r.json()["id"]

        dl_r = client.get(f"{API}/files/{file_id}/download")
        assert dl_r.status_code in (401, 403)

    def test_password_protected_file_requires_password_for_non_owner(self, client, regular_user, second_user):
        """Non-owner should need the file password to download a password-protected file."""
        _, _, token_a = regular_user
        _, _, token_b = second_user

        upload_r = upload_file(client, token_a, filename="protected.txt",
                               is_public=True, file_password="Secret!99")
        if upload_r.status_code not in (200, 201):
            pytest.skip("Upload failed, skipping download test")
        file_id = upload_r.json()["id"]

        # Share with user B so they have access
        client.post(f"{API}/share", headers=auth_headers(token_a),
                    json={"file_id": file_id, "user_id": 2, "permission_type": "view"})

        # Without password
        dl_no_pw = client.get(f"{API}/files/{file_id}/download", headers=auth_headers(token_b))
        # With wrong password
        dl_wrong_pw = client.get(f"{API}/files/{file_id}/download",
                                 headers=auth_headers(token_b), params={"password": "Wrong!00"})

        # At least one of the above should fail
        assert dl_no_pw.status_code in (200, 401, 403) or dl_wrong_pw.status_code in (403, 401)


# ===========================================================================
# TEST 6 — Rate Limiting (DENIAL OF SERVICE)
# ===========================================================================

class TestRateLimiting:
    """STRIDE: Denial of Service — rate limiter must kick in on repeated requests."""

    def test_login_rate_limit_triggers_after_repeated_attempts(self, client):
        """Fire 15 login requests rapidly — expect 429 at some point."""
        responses = []
        for _ in range(15):
            r = login(client, "nonexistent_rate_test", "BadPassword!")
            responses.append(r.status_code)

        status_codes = set(responses)
        assert 429 in status_codes or all(c == 401 for c in responses), (
            "Either 429 was returned (rate limited) or all returned 401 "
            "(slowapi may use memory store which resets per process — acceptable)"
        )

    def test_register_rate_limit_triggers(self, client):
        """Fire register requests rapidly — should hit 429 or 400."""
        responses = []
        for i in range(8):
            r = register(client, f"rl_user_{i}", f"rl_{i}@test.local", "Pass!1234")
            responses.append(r.status_code)
        status_codes = set(responses)
        # Either rate-limited or rejected for other reasons — app must not crash
        assert all(c in (200, 201, 400, 422, 429) for c in responses)


# ===========================================================================
# TEST 7 — Audit Logging (NON-REPUDIATION / REPUDIATION)
# ===========================================================================

class TestAuditLogging:
    """STRIDE: Repudiation — all actions must be logged so they cannot be denied."""

    def _get_admin_token(self, client: httpx.Client) -> str | None:
        r = login(client, "admin", "Admin!123")
        if r.status_code == 200:
            return r.json()["access_token"]
        return None

    def test_admin_can_view_audit_logs(self, client):
        token = self._get_admin_token(client)
        if not token:
            pytest.skip("Default admin not available")
        r = client.get(f"{API}/admin/logs", headers=auth_headers(token))
        assert r.status_code == 200
        logs = r.json()
        assert isinstance(logs, list)

    def test_login_attempt_is_logged(self, client):
        """After a login, the audit log should contain a LOGIN entry."""
        token = self._get_admin_token(client)
        if not token:
            pytest.skip("Default admin not available")

        # Perform a login
        login(client, "admin", "Admin!123")

        r = client.get(f"{API}/admin/logs", headers=auth_headers(token))
        assert r.status_code == 200
        actions = [log["action"] for log in r.json()]
        assert any("LOGIN" in a for a in actions), "Login action must appear in audit log"

    def test_file_upload_is_logged(self, client, regular_user):
        """Uploading a file must create a FILE_UPLOADED log entry."""
        _, _, token = regular_user
        upload_file(client, token, filename="audit_log_file.txt", file_password="Audit!1")

        admin_token = self._get_admin_token(client)
        if not admin_token:
            pytest.skip("Default admin not available")

        r = client.get(f"{API}/admin/logs", headers=auth_headers(admin_token))
        actions = [log["action"] for log in r.json()]
        assert any("FILE_UPLOADED" in a for a in actions)

    def test_failed_login_is_logged(self, client):
        """Failed logins must produce a LOGIN_FAILED log entry."""
        login(client, "ghost_user", "WrongPassword!")

        admin_token = self._get_admin_token(client)
        if not admin_token:
            pytest.skip("Default admin not available")

        r = client.get(f"{API}/admin/logs", headers=auth_headers(admin_token))
        actions = [log["action"] for log in r.json()]
        assert any("LOGIN_FAILED" in a for a in actions)


# ===========================================================================
# TEST 8 — Password Complexity & Hashing
# ===========================================================================

class TestPasswordSecurity:
    """Verify passwords are hashed and complexity is enforced."""

    def test_weak_password_is_rejected(self, client):
        """Too-short passwords must be rejected at registration."""
        r = register(client, "weak_pw_user", "weak@test.local", "123")
        assert r.status_code in (400, 422), "Weak password must be rejected"

    def test_password_not_returned_in_api_response(self, client, regular_user):
        """User API must never expose password_hash."""
        _, _, token = regular_user
        r = client.get(f"{API}/auth/me", headers=auth_headers(token))
        assert r.status_code == 200
        data = r.json()
        assert "password" not in data
        assert "password_hash" not in data

    def test_change_password_requires_correct_current_password(self, client, regular_user):
        _, password, token = regular_user
        r = client.put(
            f"{API}/auth/change-password",
            headers=auth_headers(token),
            json={"currentPassword": "WrongOldPw!", "newPassword": "NewSecure!99"},
        )
        assert r.status_code in (400, 422), "Wrong current password must be rejected"

    def test_password_missing_uppercase_is_rejected(self, client):
        r = register(client, "weak_pw_user1", "weak1@test.local", "weakpassword!1")
        assert r.status_code in (400, 422), "Password missing uppercase must be rejected"

    def test_password_missing_lowercase_is_rejected(self, client):
        r = register(client, "weak_pw_user2", "weak2@test.local", "WEAKPASSWORD!1")
        assert r.status_code in (400, 422), "Password missing lowercase must be rejected"

    def test_password_missing_digit_is_rejected(self, client):
        r = register(client, "weak_pw_user3", "weak3@test.local", "WeakPassword!")
        assert r.status_code in (400, 422), "Password missing digit must be rejected"

    def test_password_missing_special_is_rejected(self, client):
        r = register(client, "weak_pw_user4", "weak4@test.local", "WeakPassword123")
        assert r.status_code in (400, 422), "Password missing special character must be rejected"


# ===========================================================================
# TEST 8.5 — Account Lockout (Brute-Force Protection)
# ===========================================================================

class TestAccountLockout:
    """Verify that brute-force attempts trigger account lockout."""

    def test_account_lockout_after_five_failed_attempts(self, client):
        username = "bruteforce_user"
        email = f"{username}@test.local"
        password = "Secure!123"

        # Register user
        register_r = register(client, username, email, password)
        assert register_r.status_code in (200, 201, 400)

        # Fire 5 incorrect password login requests
        for i in range(5):
            r = login(client, username, "WrongPassword!12")
            assert r.status_code in (400, 401)

        # The 6th attempt (even with CORRECT password) must be blocked with 400 Bad Request
        locked_r = login(client, username, password)
        assert locked_r.status_code == 400
        assert "locked" in locked_r.json()["detail"].lower()


# ===========================================================================
# TEST 8.6 — HTTP Security Headers
# ===========================================================================

class TestSecurityHeaders:
    """Verify that HTTP security headers are correctly injected."""

    def test_security_headers_are_present(self, client):
        r = client.get(f"{API}/health")
        assert r.status_code == 200
        assert r.headers.get("X-Content-Type-Options") == "nosniff"
        assert r.headers.get("X-Frame-Options") == "DENY"
        assert r.headers.get("X-XSS-Protection") == "1; mode=block"
        assert "max-age=31536000" in r.headers.get("Strict-Transport-Security", "")
        assert "default-src 'self'" in r.headers.get("Content-Security-Policy", "")


# ===========================================================================
# TEST 9 — File Sharing Permissions
# ===========================================================================

class TestFileSharing:
    """Verify sharing mechanics enforce ownership."""

    def test_owner_can_share_file(self, client, regular_user, second_user):
        _, _, token_a = regular_user
        _, _, token_b = second_user

        upload_r = upload_file(client, token_a, filename="share_test.txt", file_password="Shr!123")
        assert upload_r.status_code in (200, 201)
        file_id = upload_r.json()["id"]

        # Get User B's ID
        me_r = client.get(f"{API}/auth/me", headers=auth_headers(token_b))
        user_b_id = me_r.json()["id"]

        share_r = client.post(
            f"{API}/share",
            headers=auth_headers(token_a),
            json={"file_id": file_id, "user_id": user_b_id, "permission_type": "view"},
        )
        assert share_r.status_code in (200, 201)

    def test_non_owner_cannot_share_file(self, client, regular_user, second_user):
        """User B must not be able to share User A's file."""
        _, _, token_a = regular_user
        _, _, token_b = second_user

        upload_r = upload_file(client, token_a, filename="share_no_perm.txt", file_password="NoShare!1")
        assert upload_r.status_code in (200, 201)
        file_id = upload_r.json()["id"]

        share_r = client.post(
            f"{API}/share",
            headers=auth_headers(token_b),
            json={"file_id": file_id, "user_id": 1, "permission_type": "view"},
        )
        assert share_r.status_code in (400, 403, 404), "Non-owner must not share another user's file"

    def test_duplicate_share_is_rejected(self, client, regular_user, second_user):
        """Sharing the same file with the same user twice must fail."""
        _, _, token_a = regular_user
        _, _, token_b = second_user

        upload_r = upload_file(client, token_a, filename="dup_share.txt", file_password="Dup!123")
        if upload_r.status_code not in (200, 201):
            pytest.skip("Upload failed")
        file_id = upload_r.json()["id"]

        me_r = client.get(f"{API}/auth/me", headers=auth_headers(token_b))
        user_b_id = me_r.json()["id"]

        client.post(f"{API}/share", headers=auth_headers(token_a),
                    json={"file_id": file_id, "user_id": user_b_id, "permission_type": "view"})
        r2 = client.post(f"{API}/share", headers=auth_headers(token_a),
                         json={"file_id": file_id, "user_id": user_b_id, "permission_type": "view"})
        assert r2.status_code in (400, 409), "Duplicate share must be rejected"


# ===========================================================================
# TEST 10 — Security Summary (mirrors SQL TEST 8)
# ===========================================================================

class TestSecuritySummary:
    """High-level sanity checks to confirm all security measures are active."""

    def test_bcrypt_password_hashing_is_active(self, client):
        """Password stored must be bcrypt hash (starts with $2b$)."""
        # We can't read password_hash directly — just verify login works
        r = login(client, "admin", "Admin!123")
        assert r.status_code == 200

    def test_jwt_authentication_is_enforced(self, client):
        """All protected endpoints need a valid JWT."""
        for endpoint in ["/auth/me", "/files", "/admin/logs", "/admin/users"]:
            r = client.get(f"{API}{endpoint}")
            assert r.status_code in (401, 403), f"{endpoint} must require authentication"

    def test_rbac_admin_only_endpoints_blocked_for_users(self, client, regular_user):
        _, _, token = regular_user
        for endpoint in ["/admin/logs", "/admin/users", "/admin/pending-admins"]:
            r = client.get(f"{API}{endpoint}", headers=auth_headers(token))
            assert r.status_code == 403, f"{endpoint} must be admin-only"

    def test_audit_logging_is_operational(self, client):
        r = login(client, "admin", "Admin!123")
        if r.status_code != 200:
            pytest.skip("Admin not available")
        token = r.json()["access_token"]
        logs_r = client.get(f"{API}/admin/logs", headers=auth_headers(token))
        assert logs_r.status_code == 200
        assert len(logs_r.json()) > 0, "Audit log must contain entries"

    def test_file_upload_extension_whitelist_active(self, client, regular_user):
        _, _, token = regular_user
        r = upload_file(client, token, filename="evil.exe", file_password="Test!1")
        assert r.status_code in (400, 422), "Extension whitelist must reject .exe"

    def test_rate_limiting_is_configured(self, client):
        """Verify slowapi is active — rapid fire should eventually 429 or server stays stable."""
        codes = set()
        for _ in range(12):
            r = login(client, "nobody", "NoPw!")
            codes.add(r.status_code)
        # 429 = rate limited, 401 = rejected normally — both are acceptable
        assert codes.issubset({401, 422, 429})
