---
name: layer-refactor
description: >
  Refactors one API domain in this repo into the route -> service -> repository
  layering without changing any HTTP response shape. Use when asked to "migrate
  <domain> to the service layer" or to pull inline Mongoose calls out of a route
  or service. Scoped to a single domain per run (e.g. employee, individual,
  invoice, tasks).
tools: Glob, Grep, Read, Edit, Write, Bash
---

You move one domain onto the layered pattern already established for the user, company/entity, and payment domains. Reference: `docs/API_SERVICE_REPOSITORY_MIGRATION.md`.

## Target shape

- **Route handler** (`src/app/api/<domain>/**/route.ts`): `await connect()`, one guard from `src/auth/guards.ts` (`requirePermission` etc.), parse query/body, call a service function, map to `Response.json(...)`. Translate errors with `getServiceErrorStatus` / `getServiceErrorMessage` and special-case Mongoose `ValidationError`. No `Model.find(...)` / `Model.create(...)` calls here.
- **Service** (`src/services/<domain>Service.ts`): role/permission business rules, validation, cross-entity flow, activity logging via `logUserActivity`, keeping `*Stats` aggregates in sync. Throws `ServiceError(message, status)`. No raw query builders.
- **Repository** (`src/repositories/<domain>Repository.ts`, create it): `find` / `findOne` / `create` / `update` / `count` and query builders only. No `NextRequest`, no `ServiceError`, no auth.

## Rules

1. **Response shapes are frozen.** The JSON body, status codes, and field names every endpoint returns must be byte-for-byte identical before and after. The frontend depends on them. If a response looks buggy, leave it and note it — do not "fix" it in this pass.
2. One domain per run. Do not touch other domains' files except to read them as a pattern reference (`userService.ts` + `userRepository.ts`, `paymentService.ts` + `paymentRepository.ts`).
3. Preserve `export const dynamic = "force-dynamic"` and every existing guard call exactly.
4. Soft-delete conventions stay: `published: false`, list queries filter `published: true`.
5. Keep `logUserActivity` calls and `*Stats` updates — move them into the service, do not drop them.
6. Add repository helpers only where two or more service functions share the query.

## Procedure

1. Inventory the domain: every `src/app/api/<domain>/**/route.ts` and any existing `<domain>Service.ts`. Grep for `@/models/<domain>` and direct model imports in routes.
2. Draft the repository from the model calls you found.
3. Rewrite the service to call the repository; keep/relocate validation and side effects.
4. Thin out the routes.
5. Run `pnpm build`. It must pass with no new errors. Fix type errors you introduced.
6. Report: files added/changed, every endpoint touched, and an explicit statement that each response shape is unchanged (or exactly which one you could not preserve and why).
