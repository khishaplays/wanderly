# Sprint 3.1: read-only County API

The FastAPI application is `app.main:app`. It registers routers from
`app/routers/` with `app.include_router`. `app/__init__.py` and `app/routes/`
contain the separate legacy Flask application; this sprint does not extend it.

## Endpoints

`GET /api/counties` returns a JSON array ordered by ascending official county
code, with the exact fields `id` (integer), `code` (string), `name` (string), and
`slug` (string). A database populated by the county foundation returns 47 rows.
The endpoint reads actual records: it neither seeds missing counties nor invents
IDs. An empty table returns `[]`.

`GET /api/counties/nairobi-city` returns the matching county object, for example:

```json
{"id": 123, "code": "047", "name": "Nairobi City", "slug": "nairobi-city"}
```

The ID above is illustrative; clients must use the returned database ID. Slugs
match exactly and are case sensitive. County codes and legacy county-name aliases
are not accepted as alternative slug lookups. Absent slugs return HTTP 404:

```json
{"detail": "County not found"}
```

POST, PUT, PATCH and DELETE are not implemented and return HTTP 405 for these
paths. Both GET routes use the existing `get_db` session dependency and the
existing County model. Responses are defined by `CountyResponse` and exposed in
FastAPI's `/docs` and `/openapi.json`. Existing destination endpoints are unchanged.

## Validation and rollout requirements

From `backend/`, run `venv/bin/python -B -m unittest discover -s tests -v`.
The suite has 21 tests (six County API tests plus 15 foundation tests).
API tests import the real FastAPI app with a substituted database-provider module,
then override its dependency with in-memory SQLite sessions. They do not import
the configured database module, load its credentials, or connect to Supabase.
They check ordering independent of IDs/insertion order, exact response fields,
all 47 slug lookups, unknown slugs, empty tables, write-method rejection, OpenAPI,
existing destination responses and SELECT-only request SQL.

The installed Starlette/httpx combination emits a TestClient deprecation warning;
no dependency changes are needed for the currently passing tests.

No migration is introduced or modified. Before any separately approved release,
verify the county foundation exists and is populated in the intended environment,
and confirm the server runs `app.main:app`. An unmigrated database cannot serve
these routes successfully. Production schema state has not been inspected.
Real PostgreSQL integration and deployment verification remain separate checks.
This implementation does not authorize migrations, configuration changes or deployment.
