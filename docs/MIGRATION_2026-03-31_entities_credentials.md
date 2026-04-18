# Migration Report - 2026-03-31

## Scope
Migrated from legacy schemas where `documents` and `password` were embedded in:
- companies
- employees

To new structure:
- `entities` (discriminator-based company/employee/individual)
- `entityDocuments`
- `credentials` (encrypted secret values)

## Script
- scripts/migrate-legacy-schema-to-entities.mjs
- scripts/postcheck-migration-entities.mjs

## Encryption
Credentials are encrypted using AES-256-GCM before storing in `credentials.secret`.
Encryption key source priority:
1. `CREDENTIALS_ENCRYPTION_KEY`
2. `JWT_SECRET`
3. fallback dev key (only if env vars missing)

## Execution Summary
- companiesScanned: 392
- employeesScanned: 357
- entitiesUpserted: 749
- documentsInserted: 452
- credentialsInserted: 14
- legacyEntityPasswordsMigrated: 0
- credentialsEncryptedInPlace: 0

## Notes
- Entity `_id` values are preserved from legacy `companies`/`employees` records.
- This preserves references in related collections (for example records pointing to company/employee ids).
- Migration is idempotent for inserted entity/document/credential records by relying on `_id` upsert semantics.

## Post-check Summary
Legacy vs migrated counts were validated after migration.

Legacy:
- companies: 392
- employees: 357
- documents embedded total: 452 (283 + 169)
- credentials embedded total: 14 (12 + 2)

Migrated:
- entities.company: 392
- entities.employee: 357
- entityDocuments: 452
- credentials: 14
- credentialsEncrypted: 13
- credentialsLegacyPasswordField: 0

Delta:
- companies: 0
- employees: 0
- documents: 0
- credentials: 0

Encryption note:
- One credential row has an intentionally empty secret (no plaintext value existed), so encrypted non-empty count is 13/14.

## Production Guidance
For production rollout, follow:
- docs/MIGRATION_RUNBOOK_PRODUCTION.md
