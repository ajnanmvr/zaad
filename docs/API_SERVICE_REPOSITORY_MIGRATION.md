# API Service + Repository Migration

This project has many API routes. To keep route handlers small and make domain logic reusable, use this layering:

1. API route: request parsing, auth/permission guard, response mapping.
2. Service: business rules and orchestration.
3. Repository: database queries and persistence only.

## Current migration status

- Completed: user domain (`src/services/userService.ts` + `src/repositories/userRepository.ts`).
- Completed: company domain (`src/services/entityService.ts` company operations + `src/services/companyService.ts` + company repositories).
- Completed: payment domain (`src/services/paymentService.ts` + `src/repositories/paymentRepository.ts`).
- Pending: employee, individual, invoice, tasks, and other API domains.

## Migration checklist per domain

1. Create `src/repositories/<domain>Repository.ts`.
2. Move direct model operations from service to repository.
3. Keep validation and business rules in service.
4. Keep route handlers thin and unchanged in contract.
5. Validate with TypeScript errors and endpoint smoke tests.

## Example boundaries

- Route should do: `connect()`, `requirePermission()`, parse query/body, call service, return `Response.json(...)`.
- Service should do: role checks, validation, cross-entity business flow, activity logging.
- Repository should do: `find`, `create`, `update`, `count`, and query builders.

## Notes for gradual rollout

- Migrate one domain at a time to reduce risk.
- Preserve existing response shape to avoid frontend regressions.
- Add repository helper functions only when shared by multiple service actions.
