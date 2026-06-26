# 456cafe — backend

NestJS API + Prisma + Socket.io. Powers `admin-hq`, `branch-pos`, `buyer-liff`,
and `translator` frontends.

For full setup (Postgres, env vars, deploy), see [`../SETUP.md`](../SETUP.md).

## Quick start

```bash
# from the repo root
docker compose up -d postgres

cd backend
cp .env.example .env          # fill in JWT_SECRET, ADMIN_PASSWORD
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run start:dev             # http://localhost:5001
```

## Project layout

```
src/
  app.controller.ts       # /api/health (DB-pinging)
  app.module.ts           # Wires JwtModule, ThrottlerModule, all controllers
  main.ts                 # Bootstrap, Helmet, CORS, ValidationPipe, secret guard

  branch.controller.ts    # /api/branches/*       (mutations: ADMIN)
  menu.controller.ts      # /api/menu, /categories, /products (mutations: ADMIN)
  order.controller.ts     # /api/orders, /api/stats/global
  inventory.controller.ts # /api/inventory/*      (STAFF or ADMIN)
  ai.controller.ts        # /api/ai/*
  auth.controller.ts      # /api/auth/*
  user.controller.ts      # /api/users/*          (mutations: ADMIN)
  address.controller.ts   # /api/addresses/*      (owner-only via JWT)
  finance.controller.ts   # /api/finance/*        (ADMIN, whole class)

  *.service.ts            # Business logic
  order.gateway.ts        # Socket.io with JWT-aware room joins

  auth/
    jwt-payload.ts
    public.decorator.ts        @Public()
    roles.decorator.ts         @Roles('ADMIN')
    current-user.decorator.ts  @CurrentUser() me
    jwt-auth.guard.ts          verifies Bearer token
    roles.guard.ts             checks role against @Roles metadata

  dto/
    auth.dto.ts                SendOtp, VerifyOtp, LineLogin, AdminLogin, StaffLogin
    create-order.dto.ts        CreateOrder, UpdateOrderStatus, UpdatePayment
```

## Scripts

```bash
npm run start:dev      # nest start --watch
npm run build          # compile to dist-new/
npm run start:prod     # node dist-new/src/main.js
npm run test           # jest unit tests
npm run lint           # eslint --fix
```

## Auth model — TL;DR

| Token role | Issued by | Scope |
|-----------|-----------|-------|
| `CUSTOMER` | `/api/auth/line`, `/api/auth/otp/verify` | own orders, own addresses |
| `STAFF`    | `/api/auth/staff-login` (PIN)            | orders & inventory of `branchId` baked into the token |
| `ADMIN`    | `/api/auth/admin-login` (env creds)      | everything |

Login endpoints are throttled to **5/min/IP** via `@Throttle`. Other endpoints
default to **100/min/IP**.

WebSocket connections must pass `auth: { token }` in the handshake — the gateway
verifies the JWT and only joins rooms the role is allowed in.
