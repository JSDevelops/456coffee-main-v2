# 456 Coffee Ecosystem

End-to-end coffee-shop platform — customers order from LINE, baristas
prepare drinks on a KDS, dispatchers hand off to riders, and HQ tracks
sales / inventory / cashflow across branches.

```
buyer-liff   →   ┐
branch-pos   ↔   │  NestJS API + Socket.io  ↔  PostgreSQL
admin-hq     ↔   │  (port 5001)             ↔  Gemini (optional)
translator   →   ┘
```

## Where to start

| If you want to… | Read |
|----------------|------|
| Run it locally | [`SETUP.md`](SETUP.md) |
| Understand the architecture | [`ARCHITECTURE.md`](ARCHITECTURE.md) |
| Work on the backend | [`backend/README.md`](backend/README.md) |
| Deploy to production | [`SETUP.md` § "Production deploy"](SETUP.md#4-production-deploy-render) |

## Stack at a glance

- **Backend:** NestJS 11, Prisma 6, PostgreSQL, Socket.io 4
- **Frontends (4):** React 19, Vite, Tailwind CSS 3, framer-motion
- **Auth:** JWT (`@nestjs/jwt`) — three roles: CUSTOMER / STAFF / ADMIN
- **Rate limiting:** `@nestjs/throttler` (5/min on login, 100/min default)
- **HTTP hardening:** Helmet
- **Hosting:** Render (Postgres + web service via blueprint), frontends on Vercel/Netlify

## Default credentials (dev only — rotate before deploying!)

```
admin / changeme123          # admin-hq
PIN: 4567                    # branch-pos staff
OTP: 123456                  # buyer-liff phone login (mocked)
```

The API **refuses to start in production** with these defaults.

## Repo layout

```
456cafe-main/
├── backend/              NestJS API
│   ├── src/
│   │   ├── auth/         Guards, decorators, JwtPayload
│   │   ├── dto/          class-validator schemas
│   │   ├── *.controller.ts
│   │   ├── *.service.ts
│   │   └── order.gateway.ts
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── frontend/
│   ├── admin-hq/         HQ dashboard (login → manage everything)
│   ├── branch-pos/       Branch operations (PIN → POS/Barista/QC/Dispatch/...)
│   ├── buyer-liff/       LINE LIFF customer app
│   └── translator/       Thai ↔ English translator (Gemini)
├── docker-compose.yml    Local Postgres
├── render.yaml           Render blueprint (Postgres + web service)
└── SETUP.md              ← Start here
```

## Status

Core platform is staging-ready. Outstanding items requiring operator decisions
(SMS provider for OTP, Redis for multi-instance, real LIFF id, payment gateway)
are tracked at the bottom of [`SETUP.md`](SETUP.md#6-outstanding--needs-operator-decision).

## Historical documents

Earlier troubleshooting and test reports are kept for reference:
`ARCHITECTURE.md`, `BACKEND_QUICK_FIX.md`, `BACKEND_TROUBLESHOOTING.md`,
`ISSUE_RESOLUTION_GUIDE.md`, `QUICK_START.md`, `QUICK_LINKS.md`,
`LINKS_SUMMARY.md`, `WEB_LINKS.md`, `TESTING_CHECKLIST.md`,
`TEST_REPORT.md`, `README_TEST_REPORT.md`, `TEST_EXECUTION_SUMMARY.txt`,
`INDEX.txt`. Treat them as historical — `SETUP.md` is the current source of truth.
