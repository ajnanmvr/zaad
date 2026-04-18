# RBAC and Security Test Plan

## Automated Baseline
Run:

```bash
node scripts/rbac-matrix-check.mjs
```

This verifies role-permission matrix assumptions for partner and employee access.

## Manual API Smoke Tests
All mutating API requests must include the `x-csrf-token` header and valid auth cookies.

1. Login and refresh flow
- POST `/api/users/auth/login`
- POST `/api/users/auth/refresh`
- Expect refreshed access cookie and 200 response

2. Session controls
- GET `/api/users/auth/sessions`
- DELETE `/api/users/auth/sessions/{id}` for a non-current session
- POST `/api/users/auth/logout-all`

3. Permission checks
- Employee should get 403 for `GET /api/users`
- Partner should get 200 for `GET /api/users`
- Employee should get 200 for `GET /api/company`

4. CSRF enforcement
- Send POST `/api/payment` without `x-csrf-token` header
- Expect 403 `CSRF validation failed`

5. Rate limiting
- Burst login attempts from same IP beyond threshold
- Expect 429 with `Retry-After` header

## Audit Log Validation
Check `useractivities` for actions:
- `login`
- `logout`
- `logout_all`
- `token_refresh`
- `session_revoke`
- `auth_denied`

## Residual Risks
- Current rate limiter is Redis-backed and production-safe for shared instances if all instances point to same Redis.
- No Playwright/Jest integration has been added in this pass. Introduce those for full CI regression coverage.
