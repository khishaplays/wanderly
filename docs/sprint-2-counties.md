# Sprint 2: Kenya county foundation

Implementation only. No Alembic migration has been executed. No configured
database has been contacted, and DATABASE_URL has not been changed.

## Structure and compatibility

- `counties`: integer primary key; unique three-character official code; official
  name; unique lowercase slug; unique index on `lower(trim(name))`.
- Code checks accept only the zero-padded administrative codes `001`–`047`.
  An explicit SQL `IN` list replaces substring/range checks in both the model and
  migration. It uses standard SQL supported by PostgreSQL and SQLite, avoiding
  numeric casts, regular expressions and ordering assumptions. These are not ISO
  3166-2 codes. Tests require the complete set of 47 and constraint parity.
- `destinations.county_id`: nullable, indexed FK to `counties.id`, with database
  `ON DELETE RESTRICT`. No county relationship may cascade-delete destinations.
- The original `destinations.county` text remains unchanged and continues to be
  serialized by the unchanged Pydantic list/detail schemas. The relationship is
  named `county_record` to avoid replacing that text attribute.
- Existing destination/activity IDs, content, prices and relationships remain.
  This phase adds no categories, attraction listings, prices or other modules.
- `app.base.Base` holds metadata without configuration or engine side effects;
  `app.database.Base` re-exports that same object for existing consumers.

New writes can omit county_id. A writer that supplies it must resolve the county
explicitly and keep legacy county text consistent. No new write endpoint is added.
Do not make county_id non-null until all actual records and writers are reviewed.

## Dataset provenance

Reviewed on 2026-10-25:

- Official names and ordering: [Constitution, First Schedule, Kenya Law Reform
  Commission](https://klrc.go.ke/index.php/constitution-of-kenya/163-schedules-schedules/165-first-schedule-counties/434-1-counties).
- Administrative county numbering: [State Department for Devolution county
  information](https://www.devolution.go.ke/county-information/).

Constitutional spelling is retained, including `Taita/Taveta`, `Elgeyo/Marakwet`,
`Trans Nzoia`, `Murang'a`, and `Nairobi City`. The Devolution page has a blank code
in its first Lamu table; its county-websites table supplies code 05, consistent
with the Constitution's fifth county. Codes are stored with three digits.

`app/data/kenya_counties.py` contains all 47 explicit code/name/slug triples plus
the exact accepted aliases. The migration contains an independent frozen snapshot
so future application dataset edits cannot silently change migration history.
Tests check equality of these snapshots.

## Migration and backfill

New revision: `c47f20261025`; parent: `f1be5db7b94e`.

1. Create counties, constraints and normalized-name index.
2. Insert exactly the reviewed 47 reference rows, without assuming their IDs.
3. Add nullable county_id, its restrictive FK, and destination lookup index.
4. Set only currently null county_id values, matching `lower(trim(county))`
   against the frozen explicit aliases. Resolve FK IDs by official county code.

Seeded destination mappings: Narok -> 033, Kwale -> 002, Nairobi -> 047,
Lamu -> 005, Nakuru -> 032, Mombasa -> 001. Canonical names for all other counties
are also accepted. Selected spelling variants are explicit aliases, not fuzzy
matching. Unknown/ambiguous values stay null for review; legacy text is untouched.
Existing assignments are never overwritten. Repeating the backfill DML is safe;
the entire Alembic revision is applied once through normal revision tracking.

There is no destination INSERT, DELETE, ID change or price update in this revision.
Activities are not updated. The old seed script must not be used for this backfill.

### Unmatched county review

Only the documented aliases are accepted after case folding and trimming ordinary
leading/trailing spaces. No new aliases or inferred assignments were added during
the migration review. Potential unmatched inputs include:

- Empty or whitespace-only text and placeholders such as `Unknown` or `N/A`.
- Unlisted suffixes such as `Nakuru County`, misspellings such as `Nairob`, and
  different punctuation or internal whitespace.
- Town names such as `Naivasha`, regions such as `Coast`, numeric codes such as
  `047`, and combined names such as `Nairobi/Kiambu`.
- Tabs, newlines and non-breaking spaces: SQL `trim()` here removes ordinary
  spaces only; it does not perform broad Unicode whitespace normalization.

These are possible input patterns, not findings from Supabase: no database
inventory has been run. Every unmatched destination retains its exact county text
and a null county_id. Existing county_id assignments are never replaced.
The current schema rejects SQL NULL county text; the DML also leaves NULL unmatched
if encountered in an external or older dataset. No missing value is mapped to a
default county.

Repository audit: parsing `backend/seed.py` without importing or executing it
finds six destination records, with county values Narok, Kwale, Nairobi, Lamu,
Nakuru and Mombasa. All six match the existing aliases; there are no unmatched
county values in that seed. This does not establish coverage of actual database
records. No alias expansion or migration change was needed in this refinement.

After an approved isolated migration, inventory unresolved rows with this read-only
query (not executed during development):

```sql
SELECT id, slug, county
FROM destinations
WHERE county_id IS NULL
ORDER BY id;
```

Review each value against authoritative information. Add only explicitly reviewed
aliases through a subsequent migration, or make separately approved per-record
assignments using actual destination IDs. Keep unresolved/ambiguous rows intact.
Do not rewrite the legacy county text as part of alias matching.

## Execution procedure — future approval required

Do not run the commands below against the existing configured Supabase connection.
Its production status is unconfirmed. This document does not authorize execution.

Before a future approved run:

1. Create a disposable PostgreSQL database with synthetic or approved sanitized
   data. Start a separate test process explicitly configured for that database;
   do not edit the repository's `.env` or use the existing Supabase URL.
2. Verify target identity privately and reject any target matching production.
   Confirm PostgreSQL version, schema ownership/grants/RLS, backup and restore.
3. Verify the actual revision equals `f1be5db7b94e`, not the legacy Flask revision.
   Do not stamp a mismatched database to bypass verification.
4. Record full original destination/activity rows, IDs, counts and sequence state.
   Inventory county text, including case/whitespace variants and unmatched names.
5. Review generated SQL and lock requirements before execution. Bound backfill
   values must compile correctly for apostrophes and Unicode.
6. In that verified isolated process only, the planned command is
   `alembic upgrade c47f20261025` from `backend/`.
7. Compare all original data exactly, verify 47 counties, valid FK assignments,
   unmatched rows, API contracts and insertion sequences. Check Alembic head and
   metadata drift, including named constraints and expression indexes.

The migration uses the normal PostgreSQL transactional Alembic environment; test
failure rollback and lock timeouts before assuming operational safety. It creates
ordinary indexes appropriate for the initial catalogue, not concurrent indexes.
For a large production dataset, review locking and backfill batching separately.

## Rollback procedure — future approval required

1. Restore the prior application version first: new ORM mappings require county_id
   even though the old API contract is unchanged.
2. Export any new county assignments and county edits if they must be recoverable.
3. In the verified isolated environment, the planned command is
   `alembic downgrade f1be5db7b94e`. This removes only the new destination index,
   FK, county_id column, county name index and counties table.
4. Compare all original destination/activity data and IDs and test the old app.
   Re-upgrade and recheck backfill results.

Downgrade loses county reference data and assignments. Legacy county text survives.
Never downgrade to `base`: the original revision drops destinations and activities.
Never use cascade table drops to bypass dependencies from future revisions.

## Tests run without production access

From `backend/`:

```sh
venv/bin/python -B -m unittest discover -s tests -v
```

Tests import model metadata without `app.database`, dotenv or a configured engine.
Only an explicitly created in-memory SQLite engine is used. Model tables are
created directly; Alembic `upgrade`, `downgrade`, environment and CLI are never run.
The frozen backfill SQL is exercised as DML against synthetic in-memory records.
Migration structure is inspected through Python AST, and PostgreSQL model DDL is
compiled without a connection. Existing Pydantic list/detail shapes are asserted.
The suite additionally checks every explicit alias with case/space variants,
missing and ambiguous inputs, nullable ORM relationships, all 1,000 three-digit
codes, malformed codes, and the parent revision's legacy table columns. The
parent and new revision are parsed, never imported or executed. The new revision
directly follows `f1be5db7b94e`; its integer county FK does not alter existing
destination/activity columns. Actual database revision identity remains unverified.

Refinement validation: 15 backend tests pass. An independent complete First
Schedule name/order expectation detects county swaps even if both dataset snapshots
were changed together. Seed-derived synthetic records use non-fixture IDs and
retain identical JSON-mode list/detail schema payloads before and after backfill.
Preservation comparisons explicitly order by ID and assert equal row counts.
All 47 valid codes pass; all other three-digit codes and tested malformed values
fail. These are model/schema and DML checks, not HTTP route or migration execution.

Still required on isolated PostgreSQL: real revision upgrade/downgrade/re-upgrade,
transactional failure recovery, constraints and expression indexes under actual
collation, database locking, live route integration, sequence behaviour, RLS/grants,
and exact preservation using a representative pre-migration snapshot. SQLite and
static checks do not establish that the PostgreSQL migration executes correctly.
