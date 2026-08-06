import os
import time
import secrets
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, Response
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

BASE_DIR = os.path.dirname(__file__)
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(BASE_DIR, "..", ".env"))

import database

app = FastAPI(
    title="TradeForge Pro Network", 
    description="Portfolio Simulation API for Brokerage Onboarding and Asset Routing"
)

# Universal backend testing firewall permissions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@tradeforge.pro")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "AdminPass123!")

mock_admin_database = {
    ADMIN_EMAIL: ADMIN_PASSWORD
}

# ==========================================
# SESSION / TOKEN AUTH SYSTEM
# Sessions are persisted in SQLite so logins
# survive backend restarts (e.g. container
# restarts on the production server). Tokens
# are issued at login and destroyed at logout
# or when the TTL expires.
# ==========================================
SESSION_TTL_HOURS = int(os.environ.get("SESSION_TTL_HOURS", "168"))

def create_session(email, role):
    token = secrets.token_urlsafe(32)
    expires_at = time.time() + (SESSION_TTL_HOURS * 3600)
    database.save_session(token, email, role, expires_at)
    return token

def get_session(token):
    if not token:
        return None
    session = database.get_session(token)
    if not session:
        return None
    if time.time() > session["expires_at"]:
        database.delete_session(token)
        return None
    return session

def destroy_session(token):
    if token:
        database.delete_session(token)

# On startup, drop sessions that already expired while the server was off
database.cleanup_expired_sessions()

def extract_token(authorization):
    if authorization and authorization.startswith("Bearer "):
        return authorization.split(" ", 1)[1]
    return None

def require_admin(authorization: str = Header(None)):
    session = get_session(extract_token(authorization))
    if not session or session["role"] != "ADMIN":
        raise HTTPException(status_code=401, detail="Admin session required. Authorize from the admin portal first.")
    return session

def require_customer(authorization: str = Header(None)):
    session = get_session(extract_token(authorization))
    if not session or session["role"] != "CUSTOMER":
        raise HTTPException(status_code=401, detail="Valid client session required. Please sign in.")
    if not database.get_user_by_email(session["email"]):
        raise HTTPException(status_code=401, detail="Account no longer exists.")
    return session

@app.get("/api/health")
def health_check():
    db_ok = False
    try:
        conn = database.get_connection()
        conn.execute("SELECT 1")
        conn.close()
        db_ok = True
    except Exception:
        db_ok = False
    return {
        "status": "ok" if db_ok else "degraded",
        "service": "TradeForge Pro API",
        "time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "active_sessions": database.count_active_sessions(),
        "database": "connected" if db_ok else "error"
    }

mock_market_rates = {
    "BTCUSDT": 64250.00,
    "ETHUSDT": 3450.00,
    "EURUSDT": 1.0852,
    "GBPUSDT": 1.2740
}

class RegisterUserSchema(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    date_of_birth: str  
    phone: str = ""
    country: str = ""
    city: str = ""
    zip_code: str = ""
    address: str = ""
    id_document_type: str = ""
    documents_received: str = "NO"

class LoginUserSchema(BaseModel):
    email: EmailStr
    password: str

class AdminLoginSchema(BaseModel):
    email: EmailStr
    password: str

class UpdateUserBalanceSchema(BaseModel):
    email: EmailStr
    new_balance: float

class UpdateRateSchema(BaseModel):
    symbol: str
    new_rate: float

class AdminCreateUserSchema(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    date_of_birth: str = "1990-01-01"
    ssn_last_four: str = "0000"
    annual_income: int = 100000
    initial_balance: float = 100000.0
    kyc_status: str = "APPROVED"
    phone: str = ""
    country: str = ""
    city: str = ""
    zip_code: str = ""
    address: str = ""
    employment_status: str = ""
    occupation: str = ""
    id_document_type: str = ""
    documents_received: str = "NO"

class ChangePasswordSchema(BaseModel):
    current_password: str
    new_password: str

class DeleteUserSchema(BaseModel):
    email: EmailStr

class AdminApproveUserSchema(BaseModel):
    email: EmailStr
    new_balance: float = None

class WithdrawalRequestSchema(BaseModel):
    email: EmailStr = None
    amount: float
    address: str

class WithdrawalActionSchema(BaseModel):
    withdrawal_id: int
    status: str # 'APPROVED' or 'REJECTED'

class CloseTradeSchema(BaseModel):
    email: EmailStr = None
    pair: str
    direction: str
    lots: float
    entry_price: float
    exit_price: float
    pnl: float

DIST_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")

@app.get("/tradeforge_logo.png")
def serve_logo():
    logo_path = os.path.join(DIST_DIR, "tradeforge_logo.png")
    if not os.path.isfile(logo_path):
        raise HTTPException(status_code=404, detail="Logo not found.")
    with open(logo_path, "rb") as f:
        return Response(content=f.read(), media_type="image/png")

if os.path.isdir(os.path.join(DIST_DIR, "assets")):
    app.mount("/assets", StaticFiles(directory=os.path.join(DIST_DIR, "assets")), name="assets")

@app.post("/api/auth/register")
def register_and_kyc(user: RegisterUserSchema):
    existing = database.get_user_by_email(user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Account with this email already exists.")

    if len(user.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    time.sleep(1.2)
    database.create_user(
        user.email, user.password, user.first_name, user.last_name, 
        user.date_of_birth,
        user.phone, user.country, user.city, user.zip_code, user.address,
        user.id_document_type, user.documents_received
    )
    
    return {
        "status": "success",
        "message": "Registration submitted. Account is pending admin approval.",
        "data": {
            "email": user.email,
            "kyc_status": "PENDING",
            "buying_power": 0.00
        }
    }

@app.post("/api/auth/login")
def login_user(credentials: LoginUserSchema):
    time.sleep(0.6)
    user_record = database.get_user_by_email(credentials.email)
    
    if not user_record or not database.verify_password(credentials.password, user_record.get("password")):
        raise HTTPException(status_code=401, detail="Invalid email or password credentials.")

    if user_record["kyc_status"] != "APPROVED":
        raise HTTPException(status_code=403, detail="Account pending admin approval. Access is granted once your account is approved.")

    token = create_session(credentials.email, "CUSTOMER")

    return {
        "status": "success",
        "message": "Authentication successful.",
        "data": {
            "email": credentials.email,
            "kyc_status": user_record["kyc_status"],
            "buying_power": user_record["cash_balance"],
            "token": token
        }
    }

@app.get("/api/auth/session")
def restore_customer_session(session: dict = Depends(require_customer)):
    user = database.get_user_by_email(session["email"])
    if not user:
        raise HTTPException(status_code=401, detail="Account no longer exists.")
    return {
        "status": "success",
        "data": {
            "email": user["email"],
            "kyc_status": user["kyc_status"],
            "buying_power": user["cash_balance"]
        }
    }

@app.post("/api/auth/logout")
def logout_customer_session(authorization: str = Header(None)):
    destroy_session(extract_token(authorization))
    return {"status": "success", "message": "Client session terminated."}

@app.get("/api/auth/profile")
def get_my_profile(session: dict = Depends(require_customer)):
    user = database.get_user_by_email(session["email"])
    if not user:
        raise HTTPException(status_code=404, detail="Customer profile not found.")
    profile = dict(user)
    profile.pop("password", None)
    return {"status": "success", "data": profile}

@app.post("/api/auth/change-password")
def change_my_password(payload: ChangePasswordSchema, session: dict = Depends(require_customer)):
    user = database.get_user_by_email(session["email"])
    if not user:
        raise HTTPException(status_code=404, detail="Customer profile not found.")
    if not database.verify_password(payload.current_password, user.get("password")):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters.")
    database.change_password(session["email"], payload.new_password)
    return {"status": "success", "message": "Password updated successfully."}

# ==========================================
# WITHDRAWAL & TRADE STATEMENT ENDPOINTS
# ==========================================

@app.post("/api/withdrawals/request")
def request_withdrawal(payload: WithdrawalRequestSchema, session: dict = Depends(require_customer)):
    user = database.get_user_by_email(session["email"])
    if not user:
        raise HTTPException(status_code=404, detail="Customer profile not found.")
        
    if payload.amount <= 0 or payload.amount > user["cash_balance"]:
        raise HTTPException(status_code=400, detail="Withdrawal amount exceeds available free balance.")

    pending_total = database.get_pending_withdrawal_sum(session["email"])
    if pending_total + payload.amount > user["cash_balance"]:
        raise HTTPException(status_code=400, detail="Requested amount plus pending withdrawals exceeds available balance.")
        
    database.create_withdrawal_request(session["email"], payload.amount, payload.address)
    return {
        "status": "success",
        "message": f"Withdrawal request for ${payload.amount:,.2f} USDT submitted for admin review."
    }

@app.get("/api/withdrawals/my-requests")
def get_my_withdrawals(session: dict = Depends(require_customer)):
    requests = database.get_user_withdrawals(session["email"])
    return {"status": "success", "data": requests}

@app.get("/api/trades/history")
def get_customer_trade_history(session: dict = Depends(require_customer)):
    history = database.get_trade_history(session["email"])
    return {"status": "success", "data": history}

@app.post("/api/trades/close")
def record_closed_trade(payload: CloseTradeSchema, session: dict = Depends(require_customer)):
    user = database.get_user_by_email(session["email"])
    if not user:
        raise HTTPException(status_code=404, detail="Customer profile not found.")
    database.add_closed_trade(
        session["email"], payload.pair, payload.direction,
        payload.lots, payload.entry_price, payload.exit_price, payload.pnl
    )
    return {
        "status": "success",
        "message": f"Closed {payload.direction} {payload.pair} recorded to statement history.",
        "data": {"pnl": payload.pnl}
    }

# ==========================================
# ADMIN ENDPOINTS
# ==========================================

@app.post("/api/admin/login")
def admin_login(credentials: AdminLoginSchema):
    time.sleep(0.5)
    valid_pass = mock_admin_database.get(credentials.email)
    if not valid_pass or valid_pass != credentials.password:
        raise HTTPException(status_code=401, detail="Unauthorized admin credentials.")

    token = create_session(credentials.email, "ADMIN")
    return {
        "status": "success",
        "message": "Admin authorization granted.",
        "data": {"email": credentials.email, "token": token}
    }

@app.get("/api/admin/session")
def restore_admin_session(session: dict = Depends(require_admin)):
    return {"status": "success", "data": {"email": session["email"]}}

@app.post("/api/admin/logout")
def admin_logout(authorization: str = Header(None)):
    destroy_session(extract_token(authorization))
    return {"status": "success", "message": "Admin session terminated."}

@app.get("/api/admin/users")
def get_all_users(_admin: dict = Depends(require_admin)):
    users_list = database.get_all_users()
    return {"status": "success", "data": users_list}

@app.post("/api/admin/users/create")
def admin_create_user(payload: AdminCreateUserSchema, _admin: dict = Depends(require_admin)):
    existing = database.get_user_by_email(payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    if payload.initial_balance < 0:
        raise HTTPException(status_code=400, detail="Initial balance cannot be negative.")

    database.create_user_full(
        payload.email, payload.password, payload.first_name, payload.last_name,
        payload.date_of_birth, payload.ssn_last_four, payload.kyc_status, payload.initial_balance,
        payload.annual_income,
        payload.phone, payload.country, payload.city, payload.zip_code, payload.address,
        payload.employment_status, payload.occupation, payload.id_document_type, payload.documents_received
    )
    return {
        "status": "success",
        "message": f"Customer account created for {payload.email}.",
        "data": {
            "email": payload.email,
            "initial_balance": payload.initial_balance,
            "kyc_status": payload.kyc_status
        }
    }

@app.post("/api/admin/users/approve")
def approve_user_account(payload: AdminApproveUserSchema, _admin: dict = Depends(require_admin)):
    user = database.get_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="Customer account not found.")
    if payload.new_balance is None or payload.new_balance < 0:
        raise HTTPException(status_code=400, detail="A valid funding balance is required to approve.")

    database.approve_user(payload.email, payload.new_balance)
    return {
        "status": "success",
        "message": f"Account for {payload.email} approved and funded with ${payload.new_balance:,.2f} USDT.",
        "data": {
            "email": payload.email,
            "kyc_status": "APPROVED",
            "cash_balance": payload.new_balance
        }
    }

@app.get("/api/admin/users/{email}")
def get_customer_account_view(email: str, _admin: dict = Depends(require_admin)):
    user = database.get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=404, detail="Customer account not found.")

    user_data = dict(user)
    user_data.pop("password", None)

    return {
        "status": "success",
        "data": {
            "user": user_data,
            "withdrawals": database.get_user_withdrawals(email),
            "trades": database.get_trade_history(email)
        }
    }

@app.post("/api/admin/users/update-balance")
def update_user_balance(payload: UpdateUserBalanceSchema, _admin: dict = Depends(require_admin)):
    user = database.get_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="Customer account not found.")

    if payload.new_balance < 0:
        raise HTTPException(status_code=400, detail="Balance cannot be negative.")

    database.update_user_balance(payload.email, payload.new_balance)
    return {
        "status": "success", 
        "message": f"Balance for {payload.email} updated to ${payload.new_balance:,.2f} USDT",
        "data": {"email": payload.email, "new_balance": payload.new_balance}
    }

@app.post("/api/admin/users/delete")
def delete_user_account(payload: DeleteUserSchema, _admin: dict = Depends(require_admin)):
    user = database.get_user_by_email(payload.email)
    if not user:
        raise HTTPException(status_code=404, detail="Customer account not found.")
    database.delete_user(payload.email)
    database.delete_user_sessions(payload.email)
    return {"status": "success", "message": f"Customer account for {payload.email} permanently deleted."}

@app.get("/api/admin/withdrawals")
def get_all_withdrawals(_admin: dict = Depends(require_admin)):
    withdrawals_list = database.get_all_withdrawals()
    return {"status": "success", "data": withdrawals_list}

@app.post("/api/admin/withdrawals/action")
def update_withdrawal_action(payload: WithdrawalActionSchema, _admin: dict = Depends(require_admin)):
    success, msg = database.update_withdrawal_status(payload.withdrawal_id, payload.status)
    if not success:
        raise HTTPException(status_code=400, detail=msg)
    return {"status": "success", "message": f"Withdrawal #{payload.withdrawal_id} {payload.status}."}

@app.get("/api/admin/rates")
def get_market_rates(_admin: dict = Depends(require_admin)):
    return {"status": "success", "data": mock_market_rates}

@app.post("/api/admin/rates/update")
def update_market_rate(payload: UpdateRateSchema, _admin: dict = Depends(require_admin)):
    if payload.new_rate <= 0:
        raise HTTPException(status_code=400, detail="Rate must be greater than zero.")
    mock_market_rates[payload.symbol] = payload.new_rate
    return {
        "status": "success",
        "message": f"Market rate for {payload.symbol} set to {payload.new_rate}",
        "data": {"symbol": payload.symbol, "new_rate": payload.new_rate}
    }

# ==========================================
# SPA FALLBACK (registered LAST so /api/* wins)
# Every non-API route returns the built index.html,
# so refresh/back-forward on /about, /contact,
# /admin, /portal etc. works in production.
# ==========================================
@app.get("/{full_path:path}", response_class=HTMLResponse)
def serve_frontend_dashboard(full_path: str):
    if full_path.startswith("api/"):
        raise HTTPException(status_code=404, detail="API endpoint not found.")

    index_path = os.path.join(DIST_DIR, "index.html")
    if os.path.isfile(index_path):
        with open(index_path, "r") as file:
            return file.read()

    for path in ("../frontend/public/index.html",):
        try:
            with open(path, "r") as file:
                return file.read()
        except FileNotFoundError:
            continue
    return """
    <body style="background:#0a0f1d; color:#fff; font-family:sans-serif; padding:40px; text-align:center;">
        <h2>⚠️ File Path Missing</h2>
        <p>Run <b>npm run build</b> inside the frontend folder, or place your <b>index.html</b> inside your <b>frontend/public</b> folder.</p>
    </body>
    """
