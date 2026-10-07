"""Accounts, password hashing, and login sessions for Campus Customs.

Passwords are never stored. We store a salted PBKDF2-HMAC-SHA256 hash:
  - new accounts:  pbkdf2_sha256$<iterations>$<salt>$<hex digest>   (600,000 iterations)
  - seed accounts: pbkdf2_sha256$<salt>$<hex digest>                 (legacy format, 120,000 iterations)
Login sessions are HMAC-signed tokens in an HttpOnly cookie; the hash never leaves the backend.
"""

import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import sqlite3
import time
from collections import defaultdict, deque

from fastapi import APIRouter, HTTPException, Request, Response

from models import LoginRequest, SignupRequest, UserPublic
from tools import DB_PATH


ALGORITHM = "pbkdf2_sha256"
ITERATIONS = 600_000  # OWASP 2023 recommendation for PBKDF2-HMAC-SHA256
LEGACY_ITERATIONS = 120_000  # iterations used by the seed database's hashes
MIN_PASSWORD_LENGTH = 8

SESSION_COOKIE = "cc_session"
SESSION_TTL_SECONDS = 7 * 24 * 3600
# Set SESSION_SECRET in the environment to keep sessions valid across restarts.
SESSION_SECRET = os.environ.get("SESSION_SECRET") or secrets.token_hex(32)

# Brute-force protection: too many failed logins per email or per IP → temporary block.
FAIL_WINDOW_SECONDS = 15 * 60
MAX_FAILS_PER_EMAIL = 5
MAX_FAILS_PER_IP = 20

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ---------- Password hashing ----------


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), ITERATIONS).hex()
    return f"{ALGORITHM}${ITERATIONS}${salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    parts = stored.split("$")
    if len(parts) == 4 and parts[0] == ALGORITHM:
        _, iterations, salt, digest = parts
        iterations = int(iterations)
    elif len(parts) == 3 and parts[0] == ALGORITHM:
        _, salt, digest = parts
        iterations = LEGACY_ITERATIONS
    else:
        return False
    candidate = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), iterations).hex()
    return hmac.compare_digest(candidate, digest)  # constant-time compare


# Used when the email doesn't exist, so a wrong email takes as long as a wrong password.
_DUMMY_HASH = hash_password(secrets.token_hex(16))


# ---------- Sessions ----------


def _sign(payload: bytes) -> str:
    return hmac.new(SESSION_SECRET.encode(), payload, hashlib.sha256).hexdigest()


def create_session_token(user_id: int) -> str:
    payload = base64.urlsafe_b64encode(json.dumps({"uid": user_id, "exp": int(time.time()) + SESSION_TTL_SECONDS}).encode())
    return f"{payload.decode()}.{_sign(payload)}"


def read_session_token(token: str | None) -> int | None:
    if not token or "." not in token:
        return None
    payload, signature = token.rsplit(".", 1)
    if not hmac.compare_digest(_sign(payload.encode()), signature):
        return None
    try:
        data = json.loads(base64.urlsafe_b64decode(payload))
    except ValueError:
        return None
    if data.get("exp", 0) < time.time():
        return None
    return data.get("uid")


def set_session_cookie(response: Response, user_id: int) -> None:
    response.set_cookie(
        SESSION_COOKIE,
        create_session_token(user_id),
        max_age=SESSION_TTL_SECONDS,
        httponly=True,  # page JavaScript can't read it
        samesite="lax",
        secure=False,  # local http dev; set True behind HTTPS
    )


# ---------- Rate limiting ----------

_failures: dict[str, deque[float]] = defaultdict(deque)


def _recent_failures(key: str) -> int:
    q = _failures[key]
    cutoff = time.time() - FAIL_WINDOW_SECONDS
    while q and q[0] < cutoff:
        q.popleft()
    return len(q)


def _check_not_blocked(email: str, ip: str) -> None:
    if _recent_failures(f"email:{email}") >= MAX_FAILS_PER_EMAIL or _recent_failures(f"ip:{ip}") >= MAX_FAILS_PER_IP:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Please wait 15 minutes and try again.")


def _record_failure(email: str, ip: str) -> None:
    now = time.time()
    _failures[f"email:{email}"].append(now)
    _failures[f"ip:{ip}"].append(now)


# ---------- Database ----------


def _connect() -> sqlite3.Connection:
    # Read-write connection, used only for the users table.
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _to_public(row: sqlite3.Row) -> UserPublic:
    return UserPublic(
        id=row["id"], first_name=row["first_name"], last_name=row["last_name"], name=row["name"], email=row["email"]
    )


def get_user_by_id(user_id: int) -> UserPublic | None:
    with _connect() as conn:
        row = conn.execute("SELECT id, first_name, last_name, name, email FROM users WHERE id = ?", (user_id,)).fetchone()
    return _to_public(row) if row else None


def current_user(request: Request) -> UserPublic | None:
    user_id = read_session_token(request.cookies.get(SESSION_COOKIE))
    return get_user_by_id(user_id) if user_id else None


# ---------- Endpoints ----------


@router.post("/signup", response_model=UserPublic, status_code=201)
def signup(body: SignupRequest, response: Response) -> UserPublic:
    first, last = body.first_name.strip(), body.last_name.strip()
    email = body.email.strip().lower()
    if not first or not last:
        raise HTTPException(status_code=422, detail="Please enter your first and last name.")
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=422, detail="Please enter a valid email address.")
    if len(body.password) < MIN_PASSWORD_LENGTH:
        raise HTTPException(status_code=422, detail=f"Password must be at least {MIN_PASSWORD_LENGTH} characters.")
    if body.password != body.confirm_password:
        raise HTTPException(status_code=422, detail="Passwords do not match.")

    with _connect() as conn:
        exists = conn.execute("SELECT 1 FROM users WHERE lower(email) = ?", (email,)).fetchone()
        if exists:
            raise HTTPException(status_code=409, detail="An account with this email already exists. Try logging in.")
        cur = conn.execute(
            "INSERT INTO users (name, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)",
            (f"{first} {last}", email, hash_password(body.password), first, last),
        )
        user_id = cur.lastrowid

    set_session_cookie(response, user_id)
    return get_user_by_id(user_id)


@router.post("/login", response_model=UserPublic)
def login(body: LoginRequest, request: Request, response: Response) -> UserPublic:
    email = body.email.strip().lower()
    ip = request.client.host if request.client else "unknown"
    _check_not_blocked(email, ip)

    with _connect() as conn:
        row = conn.execute("SELECT id, password_hash FROM users WHERE lower(email) = ?", (email,)).fetchone()

    ok = verify_password(body.password, row["password_hash"] if row else _DUMMY_HASH) and row is not None
    if not ok:
        _record_failure(email, ip)
        # Same message whether the email or the password was wrong.
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    _failures.pop(f"email:{email}", None)
    set_session_cookie(response, row["id"])
    return get_user_by_id(row["id"])


@router.post("/logout", status_code=204)
def logout(response: Response) -> None:
    response.delete_cookie(SESSION_COOKIE)


@router.get("/me", response_model=UserPublic)
def me(request: Request) -> UserPublic:
    user = current_user(request)
    if user is None:
        raise HTTPException(status_code=401, detail="Not logged in.")
    return user
