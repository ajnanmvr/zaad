# Production Migration Runbook

## Goal
Migrate from legacy embedded schema to the new entity architecture with encrypted credentials.

Legacy:
- companies documents contain embedded `documents[]` and `password[]`
- employees documents contain embedded `documents[]` and `password[]`

Target:
- `entities` (discriminator model: company, employee, individual)
- `entityDocuments`
- `credentials` (encrypted `secret` field)

## Migration Scripts
- `scripts/migrate-legacy-schema-to-entities.mjs`
- `scripts/postcheck-migration-entities.mjs`

## Prerequisites
1. Confirm production backup exists (full MongoDB snapshot) before migration.
2. Confirm app code with new models/services/routes is deployed or ready to deploy.
3. Confirm environment variables are present in production:
   - `MONGO_URI`
   - `CREDENTIALS_ENCRYPTION_KEY` (required, stable, secret)
   - `JWT_SECRET` (fallback only)
4. Freeze writes during migration window (recommended):
   - Enable maintenance mode, or
   - Stop API writes briefly

## Recommended Deployment Order
1. Deploy application code first (new schema/services/routes).
2. Run migration script.
3. Run post-check script.
4. Smoke-test critical API endpoints.
5. Re-enable writes.

This order is safe because the app reads from new collections, and migration is idempotent for inserted target documents.

## Execution Steps

### Step 1: Backup
Run your platform backup workflow (Atlas snapshot or mongodump).

### Step 2: Run Migration
From project root:

```powershell
node scripts/migrate-legacy-schema-to-entities.mjs
```

Expected output includes counters:
- companiesScanned
- employeesScanned
- entitiesUpserted
- documentsInserted
- credentialsInserted
- legacyEntityPasswordsMigrated
- credentialsEncryptedInPlace

### Step 3: Run Post-check

```powershell
node scripts/postcheck-migration-entities.mjs
```

Expected output sections:
- `legacy`
- `migrated`
- `deltas`

Acceptance criteria:
1. `deltas.companies = 0`
2. `deltas.employees = 0`
3. `deltas.documents = 0`
4. `deltas.credentials = 0`
5. `migrated.credentialsLegacyPasswordField = 0`
6. `migrated.credentialsEncrypted` equals total credentials except entries with intentionally empty secret

### Step 4: API Smoke Tests
Verify these endpoints on production:
1. `GET /api/company?page=1&limit=10`
2. `GET /api/employee?page=1&limit=10`
3. `GET /api/individual?page=1&limit=10`
4. `GET /api/documents/expiry?page=1&limit=20`
5. `GET /api/company/{id}` returns `credentials` (decrypted for response)
6. `GET /api/employee/{id}` returns `credentials` (decrypted for response)

## Encryption Details
Credentials are encrypted before persistence:
- Algorithm: AES-256-GCM
- Stored field: `credentials.secret`
- Storage format: `ivHex:tagHex:cipherHex`

Key derivation source priority in code:
1. `CREDENTIALS_ENCRYPTION_KEY`
2. `JWT_SECRET`
3. development fallback key

Production requirement:
- Set `CREDENTIALS_ENCRYPTION_KEY` explicitly and keep it stable.

## Idempotency and Re-runs
The migration uses upsert semantics in target collections keyed by `_id`.

Re-run behavior:
1. Existing migrated records are not duplicated.
2. Missing records are inserted.
3. Existing plaintext in `credentials.secret` is encrypted in place when detected.

## Rollback Plan
Primary rollback strategy: restore DB backup.

Operational rollback flow:
1. Put app in maintenance mode.
2. Restore pre-migration database snapshot.
3. Redeploy previous app build that reads legacy embedded schema.
4. Run smoke tests.
5. Re-open traffic.

## Post-Migration Cleanup (Optional, separate change window)
After confidence period:
1. Remove legacy embedded `password` and `documents` arrays from `companies` and `employees`.
2. Remove legacy `entityPasswords` collection if still present and unused.
3. Keep backup until cleanup is validated.

## Audit Trail
Record each production run in a dated report under `docs/` with:
1. Timestamp
2. Environment
3. Script outputs
4. Validation results
5. Operator name
