# TradeForge Pro

A full-stack brokerage / proprietary-trading portfolio demo. Customers sign up, get approved and funded by an admin, trade a live (simulated) market from a terminal, manage a USDT TRC-20 vault, and view brokerage statements. An admin portal handles customer accounts, withdrawal payouts, and market-rate overrides.

## Tech Stack

- **Backend:** FastAPI, SQLite, token-based sessions, PBKDF2 password hashing
- **Frontend:** React 18, Vite, react-router-dom, EN/ES i18n
- **Deployment:** single Docker image (multi-stage build) + docker-compose

## Demo Credentials

| Role     | Email                  | Password       |
| -------- | ---------------------- | -------------- |
| Customer | `jane.doe@propfirm.com`| `Password123!` |
| Admin    | `admin@tradeforge.pro` | `AdminPass123!`|

## Quick Start (development)

```bash
# 1. Backend API (http://127.0.0.1:8000)
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# 2. Frontend dev server (http://localhost:3000)
cd frontend
npm install
npm run dev
```

The SQLite database (`backend/tradeforge.db`) is created and seeded automatically on first run.

## Production Build

```bash
cd frontend && npm run build        # outputs to frontend/dist
# then serve everything from the backend:
cd ../backend && uvicorn main:app --host 0.0.0.0 --port 8000
```

The backend serves the built SPA (including deep links like `/portal`, `/admin`, `/about`) and all `/api/*` routes from the same origin.

## Run with Docker

```bash
docker compose up --build
# → http://localhost:8000
```

The SQLite database persists in `./data/tradeforge.db`.

## Environment Variables

| Variable         | Default                  | Description                                   |
| ---------------- | ------------------------ | --------------------------------------------- |
| `ADMIN_EMAIL`    | `admin@tradeforge.pro`   | Admin portal login email                      |
| `ADMIN_PASSWORD` | `AdminPass123!`          | Admin portal login password                   |
| `SESSION_TTL_HOURS` | `168`                  | Session lifetime before re-login (hours). Sessions are stored in SQLite, so logins survive server restarts. |
| `DATABASE_PATH`  | `backend/tradeforge.db`  | Absolute path to the SQLite database file     |
| `VITE_API_URL`   | dev: `http://127.0.0.1:8000` | Backend base URL (frontend, dev only)    |

Copy `.env.example` to `.env` at the repo root to override any backend value.

## API Overview

Public:
- `GET  /api/health` — service + database status

Customer (requires `Authorization: Bearer <token>`):
- `POST /api/auth/register` — create account (pending approval)
- `POST /api/auth/login` — returns session token + balance
- `GET  /api/auth/session` — restore a session after refresh
- `GET  /api/auth/profile` — full KYC profile (name, DOB, SSN-4, income, created date)
- `POST /api/auth/change-password`
- `POST /api/auth/logout` — invalidates the session server-side
- `POST /api/withdrawals/request` — submit a USDT payout request
- `GET  /api/withdrawals/my-requests`
- `GET  /api/trades/history`
- `POST /api/trades/close` — record a closed trade to the statement

Admin (requires admin session token):
- `POST /api/admin/login`, `GET /api/admin/session`, `POST /api/admin/logout`
- `GET  /api/admin/users` · `POST /api/admin/users/create` · `POST /api/admin/users/approve`
- `GET  /api/admin/users/{email}` · `POST /api/admin/users/update-balance` · `POST /api/admin/users/delete`
- `GET  /api/admin/withdrawals` · `POST /api/admin/withdrawals/action`
- `GET  /api/admin/rates` · `POST /api/admin/rates/update`

## Project Structure

```
backend/
  main.py         FastAPI app: auth, sessions, admin + customer endpoints, SPA fallback
  database.py     SQLite schema, migrations, and helpers
frontend/
  src/
    App.jsx               Router + session restore + logout
    hooks/useBrokerState.js  Shared trading state + ticker engine
    components/           Marketing, auth gate, dashboard, terminal, vault, admin
    i18n/translations.js  EN / ES dictionary
```

## Scripts (frontend)

```bash
npm run dev       # vite dev server (port 3000)
npm run build     # production build → dist/
npm run lint      # eslint
npm run format    # prettier --write
```
