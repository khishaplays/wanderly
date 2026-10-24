# Sprint 1: Destination Catalogue Foundation

## Frontend phase

Implemented on `develop`, without backend, database, environment or deployment changes.

- Home and Explore load `/api/destinations` through the same service and hook.
- Home features the first three returned records; this is not yet editorial ranking.
- Cards link with API-returned IDs. Local destination/activity fixtures were removed.
- One shared adapter handles categories, display emoji and nullable daily cost.
- API `categories: string[]` takes precedence, including an explicit empty array.
- A single temporary slug-based category fallback preserves current behavior until
  the approved backend rollout. Unknown slugs receive no invented categories.
- Explore reads `q` and `category` from the URL and accepts legacy `style` links.
  Filter edits canonicalize `style` to `category`, preserve unrelated parameters,
  and clearing removes search/category parameters. Browser navigation re-reads the URL.
- Unsupported audience styles (Solo, Couples, Family, Study) open unfiltered Explore;
  audience suitability is not yet modeled.
- Missing prices remain unavailable. An explicit API zero remains zero.
- Destination activities and existing detail routes remain intact.

Checks from `frontend/`: `npm run lint`, `npm test`, `npm run build`.
Tests use the existing Vite JSX compiler, React server renderer and Node test
runner. No packages are added. Test bundles are generated in ignored node_modules.
These are logic and rendered-card regression tests, not browser interaction tests.

## Backend entry point evidence

`backend/app/main.py` defines FastAPI and includes the router that returns the
array contract consumed by the frontend. `backend/run.py` still starts the legacy
Flask app. No tracked Render configuration establishes the production command.
Confirm the Render start command read-only before any entry-point cleanup. Neither
entry point has been changed.

## Proposed database phase — awaiting approval

No model changes or migration files have been created, and no migrations or seeds
have been run.

Use the existing SQLAlchemy Base and add an Alembic revision after
`f1be5db7b94e`:

1. Create `categories`: integer primary key, unique non-null slug, non-null name.
2. Create `destination_categories`: destination/category foreign keys and a
   composite primary key to prevent duplicate assignments. Add a category-first
   index for reverse lookups. Association cleanup may cascade on deletion of a
   referenced row; this does not delete destination records.
3. Backfill agreed category labels and associations using destination slugs, never
   assumed IDs. Use the consolidated legacy map as the reviewable initial dataset;
   do not infer new classifications or modify prices. Unknown destinations remain
   unclassified. Existing activities and destinations are preserved.
4. Add many-to-many ORM relationships without delete cascades from categories to
   destinations. Eager-load categories on list and detail endpoints.
5. Add `categories: list[str]` to both destination response schemas, preserving the
   current list shape, IDs, URLs, other fields and detail activities. Keep category
   ordering deterministic so the card's first label is stable.
6. Test migration upgrade/downgrade and backfill on a disposable development
   PostgreSQL database; test list/detail category parity and existing API contracts.
7. After the development migration and additive API change are verified, remove
   only the frontend legacy category fallback. Emoji presentation can remain
   centralized without determining classification.

Downgrade should remove only association/category structures. It must preserve
all destination and activity records; category assignments would be lost.

Approval is required before this phase. Any migration run must target an explicitly
verified development database, never the production Supabase database. Approval to
implement this phase does not authorize production migration, push or deployment.
