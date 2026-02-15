# ZAAD Dashboard - Technical Documentation

## Versioning
This document describes Version 1.0.0 (first formal release). The app has been maintained and updated for about two years without a tagged release. Version 2.0 is planned.

## Overview
ZAAD Dashboard is a Next.js 14 App Router application for managing business documents, company and employee records, invoices, and payment transactions. It combines a React UI with server-side API routes backed by MongoDB via Mongoose, and uses JWT-based authentication stored in HTTP-only cookies.

## Architecture Overview
### High-level layers
- **UI layer (App Router)**: Pages and layouts in `src/app` render the dashboard, lists, and detail screens.
- **Client data layer**: React Query manages client-side fetching, caching, and background updates.
- **API layer**: Next.js route handlers in `src/app/api` implement CRUD and reporting endpoints.
- **Domain layer**: Mongoose models in `src/models` define schema and relationships.
- **Data access**: MongoDB connection via `src/db/mongo.ts`. Redis client exists for optional caching.

### Request flow (typical)
1. Client UI requests data using React Query.
2. API route handler validates authentication using JWT cookie.
3. Mongoose queries execute against MongoDB.
4. Response is transformed and returned to the client.
5. UI renders and caches results via React Query.

## Application Structure
### App Router
- `src/app/layout.tsx`: global styles, React Query provider, toast notifications, devtools.
- `src/app/(logged)`: authenticated layout and dashboard routes.
- `src/app/login`: login page.
- `src/app/api`: server routes.

### Components
Reusable UI components live in `src/components` and cover layout, tables, charts, forms, modals, and headers.

### Shared utilities
- `src/helpers`: authentication and data processing helpers.
- `src/utils`: formatting, status calculation, date helpers.
- `src/types`: TypeScript domain types.

## Authentication and Authorization
### Authentication
- JWT is issued on login and stored in `auth` cookie (HTTP-only, secure).
- `getUserFromCookie` verifies JWT using `JWT_SECRET` and extracts the user ID.
- `isAuthenticated` validates that a user exists and is published.

### Authorization
- Middleware protects routes based on cookie presence and role.
- `isPartner` enforces partner-only access in selected API routes.
- Partner users receive an additional `partner` cookie on login.

### Route protection
- Middleware guards `/accounts`, `/company`, `/employee`, `/login`, and `/`.
- Partner-only paths include payment endpoints and certain admin features.

## Data Models
### User
Fields: username, fullname, password (hashed), role (partner or employee), published, deletedAt.

### Company
Fields include name, license details, contacts, documents, password list, and metadata.

### Employee
Fields include name, company reference, contacts, documents, and metadata.

### Record (Payment/Transaction)
Fields include invoice data, method, type (income/expense), company/employee references, and audit metadata.

### Invoice
Fields include client, purpose, items, quotation info, dates, and totals.

### User Activity
Tracks create/update/delete/password_change/role_change/reactivate actions with metadata and audit fields.

## API Surface (selected)
### Auth
- `POST /api/users/auth/login`: validates credentials, sets JWT cookie.
- `POST /api/users/auth/signup`: creates a user.
- `GET /api/users/auth/me`: returns current user profile.
- `GET /api/users/auth/logout`: clears cookies.

### Users
- `GET /api/users`: list users (partner only) with pagination and search.
- `POST /api/users`: create user (partner only), logs activity.
- `PUT /api/users/change-password`: change current user password.

### Companies
- `POST /api/company`: create company.
- `GET /api/company`: list companies with computed status and expiry data.

### Employees
- `POST /api/employee`: create employee.
- `GET /api/employee`: list employees with computed status and expiry data.

### Payments (Records)
- `POST /api/payment`: create record.
- `GET /api/payment`: list records with pagination and filters.
- `GET /api/payment/[id]`: fetch record.
- `PUT /api/payment/[id]`: update record.
- `DELETE /api/payment/[id]`: soft delete.

### Invoices
- `POST /api/invoice`: create invoice.
- `GET /api/invoice`: list invoices with search and pagination.
- `GET /api/invoice/[id]`: fetch invoice details.
- `PUT /api/invoice/[id]`: update invoice.
- `DELETE /api/invoice/[id]`: soft delete.

### Search
- `GET /api/search?search=...`: search companies and employees by name.

## Data Processing and Business Logic
- Document expiry and counts are derived in `processDocuments`, then transformed into UI-friendly summaries.
- Status calculation uses `calculateStatus` to mark `valid`, `expired`, or `renewal` based on expiry dates.
- Lists are sorted by expiry date, placing missing dates last.

## Configuration Details
### Next.js
- `next.config.mjs` is minimal and relies on defaults.
- Uses the App Router and server route handlers.

### TypeScript
- `strict` mode enabled.
- Path alias `@/*` maps to `src/*`.
- `moduleResolution` set to `bundler`.

### Tailwind CSS
- `tailwind.config.ts` defines custom colors, spacing, typography, and screens.
- Dark mode is class-based (`dark` class on body).
- Content paths include `src/app`, `src/components`, and `src/pages`.

### PostCSS
- Uses Tailwind and Autoprefixer.

## Environment Variables
Required environment variables (set in `.env.local`):
- `MONGO_URI`: MongoDB connection string.
- `JWT_SECRET`: secret for signing JWTs.
- `REDIS_URL`: Redis connection URL (client exists; usage is optional in code).

## Dependencies
Key runtime dependencies include:
- Next.js 14, React 18
- Mongoose for MongoDB
- React Query for data fetching
- Axios for HTTP requests
- JSON Web Token and bcryptjs for auth
- Tailwind CSS for styling

## Runtime and Build
Common scripts:
- `pnpm dev`: start dev server
- `pnpm build`: production build
- `pnpm start`: run production server
- `pnpm lint`: lint with Next.js config

## Security Notes
- JWT stored in HTTP-only cookies to reduce XSS exposure.
- Passwords are hashed with bcryptjs.
- Partner-only routes are enforced in API handlers and middleware.

## Observability
- User actions can be logged via `logUserActivity`, including IP and user agent when available.
- Redis client logs connection errors but does not block startup.

## Operational Considerations
- Database connections are cached to avoid re-creating Mongoose connections in hot reload.
- API endpoints often soft-delete records by setting `published: false`.
- Some endpoints are `force-dynamic` to avoid caching issues.

## Extension Points
- Add new models under `src/models` and load them in `src/db/mongo.ts` if needed.
- Add new API routes under `src/app/api` following route handler pattern.
- Use React Query for new data fetching with consistent caching and error handling.

## Known Gaps and TODOs
- No explicit test suite or CI configuration is present.
- Redis is configured but not used in API handlers.
- Error responses are inconsistent across routes; consider a common response format.
