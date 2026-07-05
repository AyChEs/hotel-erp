# Zellige Hotels · Hotel ERP

Full-stack hotel management platform: public booking site, client self-service area
and a complete staff ERP (bookings lifecycle, invoicing, housekeeping, dashboards) —
built as a portfolio-grade rewrite of a classroom project.

**Stack:** Spring Boot 3.4 (Java 21) REST API · JWT with rotating refresh tokens ·
PostgreSQL + Flyway · React 19 + TypeScript + Tailwind CSS 4 · TanStack Query ·
Recharts · Testcontainers · Docker.

![Landing](docs/screenshots/landing.png)

| Admin dashboard | Hotel & availability |
|---|---|
| ![Dashboard](docs/screenshots/admin-dashboard.png) | ![Detail](docs/screenshots/hotel-detail.png) |

## Features

**Public site**
- Hotel browsing with search/filters and real-time availability by dates and party size.
- Direct booking with per-board pricing (room only / B&B / half board / full board).

**Client area** — my bookings (with cancellation), my invoices (printable, VAT
breakdown), profile management.

**Staff ERP** (role-based: `ADMIN`, `MANAGER`, `RECEPTIONIST`)
- Booking lifecycle: confirm → check-in → check-out → invoice, with room status
  sync and automatic turnover-cleaning tasks.
- Invoicing with sequential numbering (`INV-2026-0001`) and 10% VAT breakdown.
- Occupancy calendar (rooms × dates), task board, full CRUDs for hotels, rooms,
  categories, clients and employees.
- Dashboard: occupancy today, monthly revenue, bookings by status (KPIs + charts).

**Security**
- Stateless JWT (15 min access) + rotating refresh tokens hashed in DB with
  **reuse detection** (a replayed token revokes the whole session family).
- BCrypt, strict CORS allowlist, RFC 7807 problem-details on every error.
- Double-booking protection: service-level overlap check **plus** a PostgreSQL
  `EXCLUDE USING gist` constraint as a race-proof backstop.

## Run it locally

Requirements: Java 21, Node 20+, Docker.

```bash
# 1. Database (PostgreSQL 16) + Mailpit (catches outgoing email at http://localhost:8025)
docker compose up -d

# 2. Backend — http://localhost:8080  (Swagger UI at /swagger-ui.html)
cd backend && ./mvnw spring-boot:run -Dspring-boot.run.profiles=dev

# 3. Frontend — http://localhost:5173 (proxies /api to the backend)
cd frontend && npm install && npm run dev
```

Demo accounts (seeded):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@hotel-erp.dev` | `Admin123!` |
| Manager | `manager@hotel-erp.dev` | `Manager123!` |
| Receptionist | `reception@hotel-erp.dev` | `Reception123!` |
| Client | `client@hotel-erp.dev` | `Client123!` |

## Tests

```bash
cd backend && ./mvnw verify      # 28 tests: unit + MockMvc + Testcontainers (real PostgreSQL)
cd frontend && npm test -- --run # Vitest unit tests
```

CI runs both suites on every push (`.github/workflows/ci.yml`).

## Architecture

```
backend/  com.ayches.hotelerp     package-by-feature
├── auth/ security/              JWT issue/refresh/rotation, filters, role rules
├── hotel/ room/ person/         CRUD features: controller → service → repository + DTO/MapStruct
├── booking/ invoice/ task/      the ERP core (lifecycle state machine, pricing, numbering)
├── dashboard/                   KPI + series aggregation (native SQL, generate_series)
├── notification/                EmailService: no-op (dev/test) / SMTP (Mailpit local, Brevo prod)
└── resources/db/migration/      Flyway: V1 schema · V2 reference data · V901 images

frontend/ src/
├── api/                         axios + single-flight token refresh, typed endpoints
├── auth/                        AuthContext, role-guarded routes
├── components/ui/               DataTable, Modal, badges, feedback states
├── pages/{public,account,admin} 16 routes, lazy-loaded
└── styles/theme.css             design system (see DESIGN.md / PRODUCT.md)
```

- **Auth flow:** access token in memory, refresh token rotated on every use;
  concurrent 401s share one refresh (single-flight) to avoid tripping reuse detection.
- **Pricing:** `total = (pricePerNight + boardSupplement × guests) × nights`,
  computed server-side; the invoice back-computes the VAT-inclusive breakdown.
- **Design system:** zellige/arabesque identity — deep teal + gold on a
  teal-tinted near-white; the pattern lives on shell surfaces, never behind data.

## Deployment (100% free tier)

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for the step-by-step guide:
Render (API, Docker) + Neon (PostgreSQL) + Vercel (SPA) + Brevo (SMTP).

## License

MIT — built by [AyChEs](https://github.com/AyChEs).
