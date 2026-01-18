# Zaad 2.0 Backend Plan (Express + MongoDB + Redis + BullMQ + Zod + GraphQL)

This document is a complete, AI-ready specification to generate an Express-based backend using MongoDB, Redis, BullMQ, Zod, GraphQL, and cronjobs. It aligns with the existing frontend types and schemas.

## Overview
- Stack: Express + TypeScript, MongoDB (Mongoose), Redis, BullMQ, Zod, GraphQL (Apollo), Multer for uploads.
- Goals: Strict validation, robust audit/activity tracking, scalable queues, cache + rate limits, REST + GraphQL parity, cron-driven upkeep.
- Base Path: `/api/v1` (REST) and `/graphql` (GraphQL).

## Architecture
- Layers: Routes/Controllers → Services → Models (Mongoose) → Repositories → Validators (Zod).
- Infra: Redis for cache, jobs, rate-limits; BullMQ queues with dedicated worker processes.
- Observability: Structured logs (pino), request IDs, centralized error handler.
- Activity Tracking: Unified `UserActivity` stream for all mutations and job events.

## Data Model (MongoDB Collections)
All documents include: `_id (ObjectId)`, `published (boolean)`, `createdAt (Date)`, `updatedAt (Date)`.

### Company
- name (string, required)
- licenseNo, companyType, emirates, phone1, phone2, email (string/email), isMainland (enum: mainland|freezone|"")
- transactionNo, remarks (string)
- passwords: [{ platform, username, password? }] (encrypted at rest)
- documents: [{ name, issueDate?, expiryDate?, attachment? }]
Indexes: `{ name: 1 }`, `{ email: 1 }`, `{ isMainland: 1 }`.

### Employee
- name (required), companyId (ObjectId → Company), isActive (boolean), emiratesId, nationality
- phone1, phone2, email (email), designation, remarks
- passwords: [{ platform, username, password? }]
- documents: [{ name, expiryDate? }]
Indexes: `{ companyId: 1 }`, `{ isActive: 1 }`.

### Individual
- name (required), nationality, passportNo, phone, email, remarks
Indexes: `{ name: 1 }`, `{ passportNo: 1 }`.

### Task
- title (required), description, assignedTo (ObjectId → User|Employee), createdBy (ObjectId → User)
- status (enum: pending|in-progress|completed), priority (enum: low|medium|high), dueDate (Date)
Indexes: `{ status: 1 }`, `{ priority: 1 }`, `{ dueDate: 1 }`, `{ assignedTo: 1 }`.

### Document
- owner: one of companyId|employeeId|individualId (ObjectId), name (required), type, expiryDate (Date), file (URL/path), remarks
- Computed (API-level): `daysUntil`, `status` (expired|expiring|valid)
Indexes: `{ expiryDate: 1 }`, `{ type: 1 }`, `{ companyId: 1 }`, `{ employeeId: 1 }`, `{ individualId: 1 }`.

### Invoice
- invoiceNo (number, required), title, suffix, client, companyId?, individualId?
- location, trn, purpose, advance, showBalance, amount (required), tax, status (draft|sent|paid|overdue)
- date (Date), validTo (Date), quotation (boolean), message, remarks, createdBy (ObjectId → User)
- items: [{ title?, desc?, rate?, quantity? }]
Indexes: `{ status: 1 }`, `{ date: 1 }`, `{ companyId: 1 }`, `{ individualId: 1 }`, `{ invoiceNo: 1 }` (unique optional).

### Record
- companyId?, individualId?, employeeId?, type (income|expense), amount (required), particular (required)
- category, method (bank|cash|tasdeed|swiper|service fee|liability), date (Date), status (cleared|pending|rejected)
- invoiceNo (string|number), suffix, number, serviceFee, self, edited (boolean), createdBy (ObjectId → User), remarks
Indexes: `{ type: 1 }`, `{ date: 1 }`, `{ method: 1 }`, `{ companyId: 1 }`, `{ individualId: 1 }`.

### Liability
- companyId?, individualId?, type (payable|receivable|loan|credit|debit|other)
- amount (required), paidAmount, description (required), status (pending|partial|paid|active|closed|overdue), dueDate (Date), remarks
Indexes: `{ status: 1 }`, `{ dueDate: 1 }`, `{ companyId: 1 }`, `{ individualId: 1 }`.

### ZaadExpense
- title (required), amount (required), category (required), date (Date)
- paymentMethod (Cash|Bank Transfer|Card|Cheque), status (pending|paid|overdue), description, remarks
Indexes: `{ date: 1 }`, `{ status: 1 }`, `{ category: 1 }`.

### User
- name (required), email (required), username, role (admin|user|partner|employee), status (active|inactive|suspended), lastLogin (Date)
- passwordHash (string, Argon2id)
Indexes: `{ email: 1 }` (unique), `{ username: 1 }` (unique), `{ role: 1 }`.

### Credential
- platform, username, password (encrypted), ownerId?, ownerType? (company|employee)
Indexes: `{ platform: 1, username: 1 }`, `{ ownerId: 1, ownerType: 1 }`.

### UserActivity (Audit Stream)
- targetUserId?, performedById?, action (string), entity (string), entityId (ObjectId), details (string), metadata (object)
- source (api|job|system), ip?, userAgent?, requestId?
Indexes: `{ performedById: 1 }`, `{ entity: 1, entityId: 1 }`, `{ createdAt: -1 }`, `{ action: 1 }`.

## Validation (Zod)
- Mirror frontend `src/lib/schemas.ts`; use Zod for request DTOs.
- Central validator middleware: parses body/query/params; returns 400 with `validationErrors`.

## Security & Auth
- JWT access + refresh tokens; Argon2id password hashing.
- RBAC: admin (full), user (standard CRUD), partner (limited), employee (self-service).
- Rate limiting with Redis (sliding window) per IP and per user.
- Input sanitization, CORS, helmet; signed URLs for file download.

## Caching (Redis)
- Cache keys: `companies:list:{hash}`, etc. TTL based on entity volatility.
- Invalidate on mutations (write-through or event-driven via BullMQ).
- Hot paths: dashboard stats, calendar events, expiring documents.

## Queues & Cron (BullMQ)
- Queues: `notifications`, `documents`, `invoices`, `analytics`, `activities`.
- Repeatable Jobs:
  - Daily 02:00: Document expiry check → mark statuses, enqueue notifications.
  - Daily 02:30: Invoice overdue check → update status, reminders.
  - Hourly: Financial aggregates → cache totals.
  - Hourly: Activity digests → summarize and store/latest.
  - Every 5m: Rebuild calendar events cache.
- Track job lifecycle (queued/active/failed/completed) → log to `UserActivity` with `source=job`.

## File Uploads
- Accept multipart/form-data for `Document.file` via Multer.
- Store locally `uploads/` or S3; save metadata in Mongo; serve via signed URL.
- Validate MIME, max size; optional AV scan step as a job.

## API Design (REST)
- Conventions: pagination (`page`, `pageSize`), sorting (`sortBy`, `sortOrder`), filtering per entity.
- Error shape: `{ error: { code, message, details? } }`.
- Selected endpoints:
  - Auth: `POST /auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/change-password`
  - Companies: `GET/POST/PUT/DELETE /companies`, `GET /companies/:id`, related `GET /companies/:id/documents`, `GET /companies/:id/employees`
  - Employees, Individuals: standard CRUD + filters
  - Documents: `GET /documents`, `GET /documents/expiring`, `POST /documents` (upload), `PUT/DELETE /documents/:id`
  - Tasks, Invoices, Records, Liabilities, Expenses: standard CRUD + business filters
  - Users: standard CRUD + role/status filters
  - Credentials: restricted CRUD
  - Activities: `GET /activities` (filters: `entity`, `entityId`, `action`, `performedById`, `dateFrom`, `dateTo`), `GET /activities/:id`

## GraphQL Schema (Apollo)
- Types mirror Mongo models; connections for pagination.
- Example (abbreviated):

```graphql
type Company { id: ID!, name: String!, email: String, isMainland: String, createdAt: DateTime!, updatedAt: DateTime! }
type Employee { id: ID!, name: String!, companyId: ID, isActive: Boolean, email: String }
type Document { id: ID!, name: String!, type: String, expiryDate: DateTime, status: String, file: String }
type UserActivity { id: ID!, entity: String!, entityId: ID, action: String!, source: String!, details: String, createdAt: DateTime! }

input Pagination { page: Int = 1, pageSize: Int = 20 }
input CompanyFilter { q: String, isMainland: String }

type Query {
  companies(filter: CompanyFilter, page: Pagination): [Company!]!
  company(id: ID!): Company
  activities(entity: String, entityId: ID, action: String, performedById: ID, dateFrom: DateTime, dateTo: DateTime, page: Pagination): [UserActivity!]!
}

input CompanyInput { name: String!, email: String, isMainland: String }
type Mutation {
  createCompany(input: CompanyInput!): Company!
  updateCompany(id: ID!, input: CompanyInput!): Company!
  deleteCompany(id: ID!): Boolean!
}
```

- Auth via context; RBAC guards in resolvers; cache popular queries.

## Business Rules
- Document status: `expired` if `expiryDate < now`, `expiring` if within 30 days, else `valid`.
- Invoices: recompute totals from items if provided; validate against `amount` and `tax`.
- Records: `method=liability` requires valid Liability link.
- Liabilities: auto-update `status` based on `paidAmount` vs `amount`.
- Activities: emit entries on every mutation and job transition.

## Environment & Config
- `MONGO_URI`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `GRAPHQL_PATH=/graphql`, `API_BASE=/api/v1`.
- `FILE_UPLOAD_DIR`, `S3_BUCKET`, `S3_REGION`, `FILE_MAX_SIZE_MB`.
- Job timings: `CRON_DOC_CHECK`, `CRON_INVOICE_CHECK`, `CRON_ANALYTICS`, `CRON_ACTIVITY_DIGEST`.

## Testing Strategy
- Unit: services, validators, RBAC.
- Integration: Express routes with `mongodb-memory-server`, Redis test instance.
- Worker tests: BullMQ job handlers with mocked services.
- GraphQL: resolver tests and schema validation.

## Deployment
- Docker Compose: MongoDB, Redis, API, Worker.
- Health checks: `/health` (REST) and GraphQL readiness.
- Configurable concurrency for workers; metrics on queue depths and job timings.

## AI Generation Prompt (Copy-Paste Ready)

"""
Generate an Express + TypeScript backend for Zaad 2.0 with MongoDB (Mongoose), Redis, BullMQ, Zod validation, Apollo GraphQL, and cronjobs. Implement:

- Collections and indexes as defined in Data Model.
- REST endpoints under `/api/v1` and a GraphQL schema/resolvers under `/graphql` with parity for core queries/mutations.
- Zod validators for all payloads; centralized validation middleware.
- JWT auth with refresh tokens, RBAC guards across REST and GraphQL.
- Redis caching and rate limiting; invalidation on mutations.
- BullMQ queues and repeatable jobs for document expiry, invoice overdue, analytics aggregates, activity digests; log job lifecycle to `UserActivity`.
- File uploads (Multer) for `Document.file` and signed URL serving.
- Unified error shape and structured logging with request IDs.
- Environment/config variables and Docker Compose (Mongo, Redis, API, Worker).
- Tests: unit/integration for routes, resolvers, services, and job handlers.
- Deliverables: full codebase, seed scripts, README, OpenAPI (for REST) and GraphQL SDL.
"""

## Quick Run
- Frontend dev: `pnpm dev`
- Backend dev (generated): `pnpm dev:api` and `pnpm dev:worker`
- Test: `pnpm test`

---
Use this plan to generate the backend aligned with Express/Mongo/Redis/BullMQ/Zod/GraphQL and comprehensive activity tracking.
