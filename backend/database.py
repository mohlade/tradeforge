import sqlite3
import os
import re
import time
import hashlib
import secrets
import tempfile

DB_PATH = os.getenv("DATABASE_PATH") or os.path.join(os.path.dirname(__file__), "tradeforge.db")

TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL") or ""
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN") or ""

try:
    import turso_serverless
    HAS_TURSO = True
except ImportError:
    turso_serverless = None
    HAS_TURSO = False

USE_TURSO = bool(HAS_TURSO and TURSO_DATABASE_URL and TURSO_AUTH_TOKEN)

# ---- Payout simulation settings -------------------------------------------
# Withdrawals are simulated: no real USDT ever leaves the platform. Approval
# attempts a payout and records the outcome so the UI can exercise both the
# success and the failure paths.
PAYOUT_DAILY_LIMIT = float(os.getenv("PAYOUT_DAILY_LIMIT", "10000"))
PAYOUT_PROVIDER_AVAILABLE = os.getenv("PAYOUT_PROVIDER_AVAILABLE", "0").lower() in ("1", "true", "yes")
TRC20_ADDRESS_RE = re.compile(r"^T[1-9A-HJ-NP-Za-km-z]{33}$")

def _writable_db_path():
    try:
        with open(DB_PATH, "a", encoding="utf-8"):
            pass
        return DB_PATH
    except OSError:
        return os.path.join(tempfile.gettempdir(), "tradeforge.db")

def _turso_row_factory(cursor, row=None):
    if row is None:
        row = cursor
        cursor = None
    if cursor is None or getattr(cursor, "description", None) is None:
        return row
    return {col[0]: row[i] for i, col in enumerate(cursor.description)}

PBKDF2_ITERATIONS = 100000

def hash_password(password):
    salt = secrets.token_hex(16)
    hashed = hashlib.pbkdf2_hmac(
        'sha256', password.encode('utf-8'), salt.encode('utf-8'), PBKDF2_ITERATIONS
    ).hex()
    return f"pbkdf2_sha256${PBKDF2_ITERATIONS}${salt}${hashed}"

def verify_password(password, stored):
    if not stored or "$" not in stored:
        return stored == password
    try:
        algo, iterations, salt, expected = stored.split("$")
        actual = hashlib.pbkdf2_hmac(
            'sha256', password.encode('utf-8'), salt.encode('utf-8'), int(iterations)
        ).hex()
        return actual == expected
    except Exception:
        return False

def get_connection():
    if USE_TURSO:
        conn = turso_serverless.connect(TURSO_DATABASE_URL, auth_token=TURSO_AUTH_TOKEN)
        conn.row_factory = _turso_row_factory
        return conn
    conn = sqlite3.connect(_writable_db_path())
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY,
        password TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        dob TEXT,
        ssn_last_four TEXT,
        kyc_status TEXT DEFAULT 'APPROVED',
        cash_balance REAL DEFAULT 100000.0,
        annual_income INTEGER DEFAULT 100000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 2. Withdrawals Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS withdrawals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        amount REAL NOT NULL,
        address TEXT NOT NULL,
        status TEXT DEFAULT 'PENDING',
        payout_status TEXT,
        failure_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMP
    )
    """)

    # Migration: add payout outcome columns to existing databases
    cursor.execute("PRAGMA table_info(withdrawals)")
    withdrawal_columns = [row["name"] for row in cursor.fetchall()]
    for col, col_type in {
        "payout_status": "TEXT",
        "failure_reason": "TEXT",
        "processed_at": "TIMESTAMP",
    }.items():
        if col not in withdrawal_columns:
            cursor.execute(f"ALTER TABLE withdrawals ADD COLUMN {col} {col_type}")

    # 3. Trade History Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trade_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_email TEXT NOT NULL,
        pair TEXT NOT NULL,
        direction TEXT NOT NULL,
        lots REAL NOT NULL,
        entry_price REAL NOT NULL,
        exit_price REAL NOT NULL,
        pnl REAL NOT NULL,
        closed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # 4. Market Rates Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS market_rates (
        symbol TEXT PRIMARY KEY,
        rate REAL NOT NULL
    )
    """)

    # 5. Sessions Table (persisted so logins survive server restarts)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sessions (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        expires_at REAL NOT NULL
    )
    """)

    # Migration: add annual_income column to existing databases
    cursor.execute("PRAGMA table_info(users)")
    columns = [row["name"] for row in cursor.fetchall()]
    if "annual_income" not in columns:
        cursor.execute("ALTER TABLE users ADD COLUMN annual_income INTEGER DEFAULT 100000")

    # Migration: add KYC detail columns to existing databases
    kyc_columns = {
        "phone": "TEXT",
        "country": "TEXT",
        "city": "TEXT",
        "zip_code": "TEXT",
        "address": "TEXT",
        "employment_status": "TEXT",
        "occupation": "TEXT",
        "id_document_type": "TEXT",
        "documents_received": "TEXT DEFAULT 'NO'",
    }
    cursor.execute("PRAGMA table_info(users)")
    columns = [row["name"] for row in cursor.fetchall()]
    for col, col_type in kyc_columns.items():
        if col not in columns:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")

    # Pre-populate default demo account
    cursor.execute("SELECT email FROM users WHERE email = ?", ("jane.doe@propfirm.com",))
    if not cursor.fetchone():
        cursor.execute("""
        INSERT INTO users (email, password, first_name, last_name, dob, ssn_last_four, kyc_status, cash_balance, phone, country, city, zip_code, address, employment_status, occupation, id_document_type, documents_received)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, ("jane.doe@propfirm.com", hash_password("Password123!"), "Jane", "Doe", "1990-05-15", "4481", "APPROVED", 100000.0, "+1 (555) 010-4481", "United States", "Austin", "73301", "1280 Market Street, Suite 440", "EMPLOYED", "Portfolio Analyst", "DRIVERS_LICENSE", "YES"))

    # Backfill KYC details on older databases where the demo account predates the new columns
    cursor.execute("UPDATE users SET phone = COALESCE(phone, '+1 (555) 010-4481'), country = COALESCE(country, 'United States'), city = COALESCE(city, 'Austin'), zip_code = COALESCE(zip_code, '73301'), address = COALESCE(address, '1280 Market Street, Suite 440'), employment_status = COALESCE(employment_status, 'EMPLOYED'), occupation = COALESCE(occupation, 'Portfolio Analyst'), id_document_type = COALESCE(id_document_type, 'DRIVERS_LICENSE'), documents_received = 'YES' WHERE email = 'jane.doe@propfirm.com'")

    # Migration: re-hash any legacy plaintext passwords already stored in the DB
    cursor.execute("SELECT email, password FROM users")
    for row in cursor.fetchall():
        if row["password"] and not row["password"].startswith("pbkdf2_sha256$"):
            cursor.execute(
                "UPDATE users SET password = ? WHERE email = ?",
                (hash_password(row["password"]), row["email"])
            )

    # Pre-populate sample trade history
    cursor.execute("SELECT COUNT(*) as count FROM trade_history")
    row = cursor.fetchone()
    if row["count"] == 0:
        sample_trades = [
            ("jane.doe@propfirm.com", "BTCUSDT", "LONG", 2.0, 62100.0, 64250.0, 4300.0),
            ("jane.doe@propfirm.com", "ETHUSDT", "SHORT", 5.0, 3550.0, 3450.0, 500.0),
            ("jane.doe@propfirm.com", "EURUSDT", "LONG", 10.0, 1.0800, 1.0852, 780.0),
            ("jane.doe@propfirm.com", "GBPUSDT", "SHORT", 8.0, 1.2800, 1.2740, 720.0)
        ]
        for tr in sample_trades:
            cursor.execute("""
            INSERT INTO trade_history (user_email, pair, direction, lots, entry_price, exit_price, pnl)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """, tr)

    conn.commit()
    conn.close()

# DATABASE HELPER FUNCTIONS
def get_user_by_email(email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE email = ?", (email,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def create_user(email, password, first_name, last_name, dob,
                phone="", country="", city="", zip_code="", address="",
                id_document_type="", documents_received="NO"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO users (email, password, first_name, last_name, dob, kyc_status, cash_balance,
                       phone, country, city, zip_code, address, id_document_type, documents_received)
    VALUES (?, ?, ?, ?, ?, 'PENDING', 0.0, ?, ?, ?, ?, ?, ?, ?)
    """, (email, hash_password(password), first_name, last_name, dob,
          phone, country, city, zip_code, address, id_document_type, documents_received))
    conn.commit()
    conn.close()

def approve_user(email, new_balance):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET kyc_status = 'APPROVED', cash_balance = ? WHERE email = ?", (new_balance, email))
    conn.commit()
    conn.close()

def create_user_full(email, password, first_name, last_name, dob, ssn_last_four, kyc_status, cash_balance, annual_income=None,
                     phone="", country="", city="", zip_code="", address="",
                     employment_status="", occupation="", id_document_type="", documents_received="NO"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO users (email, password, first_name, last_name, dob, ssn_last_four, kyc_status, cash_balance, annual_income,
                       phone, country, city, zip_code, address, employment_status, occupation, id_document_type, documents_received)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (email, hash_password(password), first_name, last_name, dob, ssn_last_four, kyc_status, cash_balance, annual_income if annual_income is not None else 100000,
          phone, country, city, zip_code, address, employment_status, occupation, id_document_type, documents_received))
    conn.commit()
    conn.close()

def get_all_users():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT email, first_name, last_name, kyc_status, cash_balance FROM users")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_user_balance(email, new_balance):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET cash_balance = ? WHERE email = ?", (new_balance, email))
    conn.commit()
    conn.close()

def change_password(email, new_password):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET password = ? WHERE email = ?", (hash_password(new_password), email))
    conn.commit()
    conn.close()

def delete_user(email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM withdrawals WHERE user_email = ?", (email,))
    cursor.execute("DELETE FROM trade_history WHERE user_email = ?", (email,))
    cursor.execute("DELETE FROM users WHERE email = ?", (email,))
    conn.commit()
    conn.close()

def create_withdrawal_request(user_email, amount, address):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO withdrawals (user_email, amount, address, status)
    VALUES (?, ?, ?, 'PENDING')
    """, (user_email, amount, address))
    conn.commit()
    conn.close()

def get_user_withdrawals(user_email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM withdrawals WHERE user_email = ? ORDER BY id DESC", (user_email,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_all_withdrawals():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM withdrawals ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_pending_withdrawal_sum(user_email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT COALESCE(SUM(amount), 0) as total FROM withdrawals WHERE user_email = ? AND status = 'PENDING'",
        (user_email,)
    )
    row = cursor.fetchone()
    conn.close()
    return row["total"] if row else 0.0

def _attempt_payout(address, amount):
    """Simulate a TRC-20 USDT payout.

    Returns ``None`` when the payout succeeds, otherwise a human-readable
    failure reason. The checks mirror the most common real payout failures so
    the app can exercise its error handling without any real funds moving.
    """
    address = (address or "").strip()
    if not TRC20_ADDRESS_RE.match(address):
        return "The destination address is not a valid TRC-20 wallet address."
    if amount > PAYOUT_DAILY_LIMIT:
        return f"The payout exceeds the ${PAYOUT_DAILY_LIMIT:,.0f} per-request payout limit."
    if not PAYOUT_PROVIDER_AVAILABLE:
        return "The USDT payout provider rejected the transfer (provider code 4021)."
    return None

def update_withdrawal_status(withdrawal_id, status):
    if status not in ("APPROVED", "REJECTED"):
        return False, "Invalid withdrawal status.", {}
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM withdrawals WHERE id = ?", (withdrawal_id,))
    w = cursor.fetchone()
    if not w:
        conn.close()
        return False, "Withdrawal not found.", {}

    # Only PENDING requests can be processed, so re-processing an already
    # approved/rejected withdrawal cannot double-deduct the customer balance.
    if w["status"] != "PENDING":
        conn.close()
        return False, f"Withdrawal #{withdrawal_id} has already been processed.", {}

    w_dict = dict(w)

    if status == "REJECTED":
        cursor.execute(
            "UPDATE withdrawals SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?",
            (status, withdrawal_id)
        )
        conn.commit()
        conn.close()
        return True, f"Withdrawal #{withdrawal_id} rejected. No funds were deducted.", {"payout_status": None}

    # Approval → attempt the payout. If it fails the balance is left untouched
    # and the reason is stored so the customer can see why nothing was sent.
    failure_reason = _attempt_payout(w_dict["address"], w_dict["amount"])
    if failure_reason:
        cursor.execute(
            "UPDATE withdrawals SET status = 'APPROVED', payout_status = 'FAILED', "
            "failure_reason = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?",
            (failure_reason, withdrawal_id)
        )
        conn.commit()
        conn.close()
        return True, (
            f"Withdrawal #{withdrawal_id} approved, but the payout failed. "
            f"{failure_reason} Your balance was not debited."
        ), {"payout_status": "FAILED", "failure_reason": failure_reason}

    # Payout succeeded → deduct the customer balance exactly once.
    cursor.execute("SELECT cash_balance FROM users WHERE email = ?", (w_dict["user_email"],))
    u = cursor.fetchone()
    if u:
        new_bal = max(0, u["cash_balance"] - w_dict["amount"])
        cursor.execute("UPDATE users SET cash_balance = ? WHERE email = ?", (new_bal, w_dict["user_email"]))
    cursor.execute(
        "UPDATE withdrawals SET status = 'APPROVED', payout_status = 'PAID', failure_reason = NULL, "
        "processed_at = CURRENT_TIMESTAMP WHERE id = ?",
        (withdrawal_id,)
    )

    conn.commit()
    conn.close()
    return True, f"Withdrawal #{withdrawal_id} approved and paid.", {"payout_status": "PAID"}

def get_trade_history(user_email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM trade_history WHERE user_email = ? ORDER BY id DESC", (user_email,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def add_closed_trade(user_email, pair, direction, lots, entry_price, exit_price, pnl):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO trade_history (user_email, pair, direction, lots, entry_price, exit_price, pnl)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (user_email, pair, direction, lots, entry_price, exit_price, pnl))
    conn.commit()
    conn.close()

# SESSION HELPERS (persisted in SQLite)
def save_session(token, email, role, expires_at):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO sessions (token, email, role, expires_at) VALUES (?, ?, ?, ?)",
        (token, email, role, expires_at)
    )
    conn.commit()
    conn.close()

def get_session(token):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT token, email, role, expires_at FROM sessions WHERE token = ?", (token,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def delete_session(token):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE token = ?", (token,))
    conn.commit()
    conn.close()

def delete_user_sessions(email):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE email = ?", (email,))
    conn.commit()
    conn.close()

def count_active_sessions():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM sessions WHERE expires_at > ?", (time.time(),))
    row = cursor.fetchone()
    conn.close()
    return row["count"] if row else 0

def cleanup_expired_sessions():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM sessions WHERE expires_at < ?", (time.time(),))
    conn.commit()
    conn.close()

# Initialize tables on import
init_db()
