# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ZAAD Dashboard (`zaad-dashboard`, v2.0.0) — a Next.js 14 **App Router** admin dashboard for managing companies, employees, individuals, their documents/credentials, plus invoices, payment/transaction records, tasks, and finance reporting. React UI + Next.js route handlers backed by MongoDB (Mongoose) with Redis for caching. JWT auth in HTTP-only cookies.

## Commands

Package manager is **pnpm**.

```bash
pnpm dev            # dev server on :3000
pnpm build          # production build (also the only type-check gate — no separate tsc script)
pnpm start          # run production build
pnpm lint           # next lint (eslint-config-next)
```

There is **no test suite and no CI**. `docs/RBAC_SECURITY_TEST_PLAN.md` is a manual smoke-test checklist. Verify a change by running `pnpm build` and exercising the affected endpoint/page manually.

The one-off data-migration scripts (`scripts/`) have been removed — the legacy→entity migration is complete and not expected to run again. Some `docs/` files (`MIGRATION_RUNBOOK_PRODUCTION.md`, parts of the API/RBAC docs) still reference those deleted scripts and are historical.

## Environment

`.env.local` (not committed). Required keys:

- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — signs/verifies access & refresh JWTs
- `CREDENTIALS_ENCRYPTION_KEY` — AES-256-GCM key for encrypted entity credentials; falls back to `JWT_SECRET` then a dev default, so set it explicitly anywhere real credentials exist
- `REDIS_URL` — required; `src/db/redis.ts` throws at import if unset

## Architecture

### Request layering (route → service → repository)

Route handlers under `src/app/api/**/route.ts` are meant to be thin: `connect()`, guard, parse query/body, call a service, map the result to `Response.json(...)`. Business rules live in `src/services/*Service.ts`; raw DB access lives in `src/repositories/*Repository.ts`.

This layering is **partially rolled out** (see `docs/API_SERVICE_REPOSITORY_MIGRATION.md`): user, company/entity, and payment domains are migrated; employee, individual, invoice, tasks and others still do model access inline in the route or service. Follow the layered pattern for new/changed code in migrated domains; don't rewrite un-migrated domains wholesale unless asked.

Services throw `ServiceError(message, status)` (`src/services/serviceError.ts`). Routes translate errors with `getServiceErrorStatus` / `getServiceErrorMessage`, and separately special-case Mongoose `ValidationError`.

### Auth & authorization (two distinct layers)

1. **`src/middleware.ts`** — edge middleware. Only does: CSRF check on mutating `/api/*` requests (double-submit: `csrf-token` cookie must equal `x-csrf-token` header), issues the `csrf-token` cookie, and redirects browser routes based on `auth`/`refresh` cookie presence + JWT `exp`. It does **not** check roles or permissions, and it does not verify JWT signatures.
2. **`src/auth/guards.ts`** — real per-route authz, called inside handlers: `requireAuth`, `requireRole`, `requirePermission(request, "some.permission")`, `requireAnyPermission`. These verify the JWT (`getUserFromCookie`), load the user (`published: true`), resolve the role's permission set, and throw `AuthError(message, status)`.

Permissions model (`src/auth/permissions.ts` + `src/auth/permissionCatalog.ts`):
- Roles are **DB-backed** (`src/models/roles.ts`), resolved per-request via `roleService.getPermissionsForRole` with a 5-minute Redis cache. Editing a role must call `invalidateRolePermissionCache`.
- `superadmin` (and spelling variants) short-circuits to `ALL_PERMISSIONS`.
- Permissions expand through `PERMISSION_IMPLICATIONS` (e.g. `payments.write` implies `payments.read` implies many `payments.view.*`). Grant the broad permission; `hasPermission` handles the rest.
- The sidebar (`src/components/Sidebar/index.tsx`) gates nav with the same `hasPermission` against `user.permissions` from `/api/users/auth/me` — client gating is cosmetic; the route guard is the enforcement point.

Client side: `src/utils/clientAuthInterceptor.ts` (wired in `ReactQueryProvider`) sets `axios.defaults.withCredentials`, attaches the `x-csrf-token` header from cookie, and on a 401 does a single `/api/users/auth/refresh` then retries the request.

### Data models

`src/models/entities.ts` is a single Mongoose **discriminator** on the `entities` collection: base `Entity` + `Company` (`companies`), `Employee` (`employees`), `Individual` (`individuals`). `src/models/companies.ts`, `employees.ts`, and `individuals.ts` are one-line re-export aliases of those discriminator models — there is no separate legacy schema; everything resolves to the `entities` collection.

Related data lives in its own collections: `entityDocuments`, `entityCredentials` (AES-256-GCM encrypted `secret`, via `src/utils/credentialsCrypto.ts`). Finance rows are `records.ts` (`recordKind`: standard / self_transfer / liability / office_records, all referencing `entities`). Several `*Stats` models (`monthlyFinanceStats`, `entityRecordStats`, `liabilityEntityStats`, …) are denormalized aggregates kept in sync by the payment services — update them through the service, not by writing the collection directly.

`src/db/mongo.ts` caches the connection across hot reloads and `require()`s a fixed list of models after connecting so discriminators/refs register — add new models there if they must be loaded eagerly.

### Conventions

- **Soft delete**: set `published: false` (or `deletedAt`) rather than removing documents. List queries filter on `published: true`.
- Most API routes export `export const dynamic = "force-dynamic"`; root and `(logged)` layouts are also force-dynamic.
- Path alias `@/*` → `src/*`. TypeScript is `strict`.
- Client data fetching goes through React Query + `axios`; shared fetchers in `src/libs/queries.ts`, pagination constants in `src/config/pagination.ts`.
- Dark mode is class-based (`dark` on a wrapper); theme via `src/hooks/useColorMode.tsx`.
- Dates/timezone: helpers in `src/utils/` (`dubaiTime.ts`, `dateUtils.ts`, `formatDate*.ts`) — the business operates in Dubai time; prefer these over raw `Date` formatting.
- Route protection matcher in `middleware.ts` is an explicit path allowlist — new top-level protected sections must be added to both the `(logged)` route group and the middleware `config.matcher`.
- User actions are audited via `logUserActivity` (`src/helpers/userActivityLogger.ts`) writing to `useractivities`.

## Key directories

- `src/app/(logged)/` — authenticated pages (accounts/finance, company, employee, individual, documents, tasks, credentials, settings, users, business-pulse)
- `src/app/api/` — route handlers, grouped by domain
- `src/services/`, `src/repositories/` — domain logic / data access (see layering note)
- `src/auth/` — guards, permission catalog, implication logic
- `src/models/` — Mongoose schemas: `entities.ts` discriminators (+ alias files), related-data collections, and denormalized `*Stats` aggregates
- `src/components/` — UI (Tables, Forms, Charts, Modals, Layouts, Sidebar, Settings, entity, tasks, dashboard)
- `src/helpers/`, `src/utils/` — server helpers vs framework-agnostic utilities
- `docs/` — technical documentation and the manual RBAC/security test plan (some content is historical; see Commands)

## Project subagents

`.claude/agents/` defines two task-scoped subagents:

- **rbac-route-auditor** — read-only; run it after touching `src/app/api/**/route.ts` to check every handler is correctly permission-gated (middleware is not authorization) and follows the error / soft-delete conventions.
- **layer-refactor** — moves one API domain onto the route → service → repository pattern without changing response shapes; use for `employee`, `individual`, `invoice`, or `tasks`.
