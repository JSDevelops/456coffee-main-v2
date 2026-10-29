# 456cafe — Setup & Operations Guide

This is the single source of truth for getting the project running locally
and deploying it. ARCHITECTURE.md still documents the *what*; this doc is
the *how*.

---

## 1. Prerequisites

- Node.js 20+
- npm 9+ (or pnpm/yarn — examples use npm)
- Docker (for local Postgres) — or a managed Postgres if you prefer

---

## 2. Local development — first run

Pick one Postgres source (A, B, or C) — the rest of the steps are identical.

### A) Docker

```bash
docker compose up -d postgres
# DATABASE_URL=postgresql://cafe:cafepw@localhost:5432/cafe?schema=public
```

### B) Laragon (Windows)

Laragon Full edition includes PostgreSQL. To enable it:

1. **Open Laragon** → menu icon → **Preferences → Services and ports**.
   Make sure **PostgreSQL** is checked. Default port: `5432`.
2. **Right-click Laragon tray** → **PostgreSQL → start postgres** (or just
   click **Start All** on the main window).
3. **Create the `cafe` database**. Two options:

   **HeidiSQL** (built into Laragon):
   - Laragon main window → **Database** → opens HeidiSQL.
   - On the left, right-click the PostgreSQL session → **Create new → Database** → name it `cafe`.

   **psql** (command line):
   ```powershell
   # Laragon's PostgreSQL is usually on path when "Add Laragon to PATH" is on,
   # otherwise: cd C:\laragon\bin\postgresql\<version>\bin
   psql -U postgres -c "CREATE DATABASE cafe;"
   ```

4. **Set DATABASE_URL** in `backend/.env`. Default Laragon Postgres credentials
   are `postgres` / no password (or `root` depending on your install):
   ```
   DATABASE_URL=postgresql://postgres@localhost:5432/cafe?schema=public
   # or with password:
   DATABASE_URL=postgresql://postgres:root@localhost:5432/cafe?schema=public
   ```

### C) Managed Postgres (Neon, Supabase, Render)

Provision a free instance, copy its connection string, paste into
`backend/.env` as `DATABASE_URL`. Add `?sslmode=require` if the provider
requires it.

### Then for every option:

```bash
# 1. One-time install (every package in the repo)
cd <repo root>
npm run install:all

# 2. Configure backend
cd backend
cp .env.example .env          # fill JWT_SECRET, ADMIN_PASSWORD, DATABASE_URL
npx prisma migrate dev --name init
npx prisma db seed

# 3. Frontend env files
cd ../frontend/admin-hq    && cp .env.example .env
cd ../branch-pos           && cp .env.example .env
cd ../buyer-liff           && cp .env.example .env
cd ../landing-page         && cp .env.example .env
cd ../..                   # back to repo root

# 4. Run dev (one terminal!)
npm run dev          # backend + admin-hq      ← daily driver
# or
npm run dev:full     # backend + ALL frontends, output prefixed [api][admin][pos][liff][land]
```

Each prefixed line in the combined output tells you which process logged it.
Press `Ctrl+C` once to stop everything.

### Ports

| Service | URL |
|---------|-----|
| Backend API  | http://localhost:5001 |
| admin-hq     | http://localhost:5173 |
| branch-pos   | http://localhost:5174 |
| buyer-liff   | http://localhost:5175 |
| landing-page | http://localhost:5177 |

### Run only what you need

If you're only working on one frontend, run that one + the API:

```bash
npm run dev:api          # only the backend
npm run dev:admin        # only admin-hq (assumes API already running)
npm run dev:pos
npm run dev:liff
npm run dev:landing
```

Health check:

```bash
curl http://localhost:5001/api/health
# {"status":"ok","db":"ok",...}
```

---

## 3. Auth model

Three login paths, all return `{ ...user, token }`. Frontends store the
token in `localStorage` and a global `fetch` interceptor attaches
`Authorization: Bearer <token>` to every API call.

| Login | Endpoint | Frontend | Token role | Scope |
|-------|----------|----------|-----------|-------|
| Customer (LINE / OTP) | `POST /api/auth/line`, `/api/auth/otp/verify` | buyer-liff | `CUSTOMER` | own orders, own addresses |
| Branch staff (PIN) | `POST /api/auth/staff-login` | branch-pos | `STAFF` | orders/inventory of their branch |
| HQ admin (env creds) | `POST /api/auth/admin-login` | admin-hq | `ADMIN` | everything |

### Decorators

| Decorator | Effect |
|-----------|--------|
| `@Public()` | Skip `JwtAuthGuard` — used on login & health |
| `@UseGuards(JwtAuthGuard)` | Require any valid token |
| `@UseGuards(JwtAuthGuard, RolesGuard) + @Roles('ADMIN')` | Role-restrict |
| `@CurrentUser() me: JwtPayload` | Inject the verified token payload |
| `@Throttle({ default: { ttl, limit } })` | Tight rate limit (login routes) |
| `@SkipThrottle()` | Exempt from rate limiting (e.g. /health) |

### What's locked down today

- **Branch / Menu / Category CRUD (mutations)** → `ADMIN` only
- **Finance** → `ADMIN` only (entire controller)
- **Inventory transactions** → `STAFF` or `ADMIN`
- **Order status / payment update** → `STAFF` or `ADMIN`, STAFF restricted to own branch
- **Order create / cancel** → any authenticated user; cancel checks ownership
- **Address read/write/delete** → owner only (admin override)
- **/auth/me** → uses JWT subject, query `?userId=` is ignored
- **WebSocket join-***
  - `join-branch` → STAFF only their branch, ADMIN any
  - `join-admin` → ADMIN only
  - `join-customer` → any authenticated user

### Default credentials (rotate before production!)

```
admin / changeme123       # admin-hq login (ADMIN_USERNAME / ADMIN_PASSWORD)
PIN: 4567                 # POS staff login (POS_PIN)
OTP: 123456               # buyer-liff phone login (mock — replace with SMS gateway)
```

The backend **refuses to start in production** with these defaults — see
`checkSecrets()` in `src/main.ts`.

---

## 4. Production deploy (Render)

1. Push the repo to GitHub.
2. In Render dashboard → **New → Blueprint → connect repo**. Render reads
   `render.yaml` and provisions:
   - `cafe-db` (Postgres)
   - `456cafe-api` (Node web service, healthcheck on `/api/health`)
3. Open the API service → **Environment** tab → fill the secrets marked
   `sync: false`:
   ```
   JWT_SECRET           openssl rand -hex 32
   ADMIN_PASSWORD       a strong password
   POS_PIN              4-12 chars
   CORS_ORIGIN          https://admin.example.com,https://pos.example.com,https://liff.example.com
   GEMINI_API_KEY       (optional)
   ```
4. Trigger a deploy. The build command runs:
   ```
   npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
   ```
5. Frontends — deploy each `frontend/*` to Vercel/Netlify with
   `VITE_API_URL=https://456cafe-api.onrender.com`. Add the resulting
   origins to `CORS_ORIGIN` and redeploy the API.

---

## 5. Common operations

### Reset local DB
```bash
docker compose down -v
docker compose up -d postgres
cd backend && npx prisma migrate dev --name init && npx prisma db seed
```

### Inspect data
```bash
cd backend && npx prisma studio    # → http://localhost:5555
```

### Add a schema change
```bash
# edit prisma/schema.prisma
npx prisma migrate dev --name describe_what_changed
```

### Rotate JWT secret
1. Update `JWT_SECRET` env var.
2. Restart the API.
3. All existing tokens become invalid → users / admin / staff must re-login.

---

## 6. Outstanding — needs operator decision

Items that the codebase is *ready for* but require an external choice:

| Item | What you need to provide |
|------|-------------------------|
| Real OTP delivery | SMS provider (Twilio, ThaiBulkSMS) + API credentials. Replace the mock body of `AuthService.sendOtp`. |
| Multi-instance scaling | Redis URL — swap `ThrottlerModule` storage and `AuthService.otpMap` to Redis. |
| Multiple HQ admins | Decide: keep env-based, or add `passwordHash` to `User` model + `bcrypt`. |
| Real LIFF id | Set `VITE_LIFF_ID` in `frontend/buyer-liff/.env` from your LINE Developer console. |
| Real payment gateway | Replace mocked PromptPay UI with Omise / 2C2P / SCB Easy webhook flow. |
