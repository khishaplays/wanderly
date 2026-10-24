# Sprint 3.2: Discover Kenya county browsing

The existing React application now includes `/counties` and
`/counties/:county_slug`. The Discover Kenya navigation link stays active for
county detail routes. Existing navigation links now wrap on mobile rather than
being hidden. Home, Explore and destination routes keep their existing behaviour.

The county service uses the same VITE_API_URL convention as destinations. List
records come from GET /api/counties, are validated and sorted by official code,
then rendered without pagination or truncation. No county dataset is embedded in
the frontend. Empty API lists are displayed honestly, without inserting fixtures.
Details come from GET /api/counties/{encoded-slug}; 404 becomes a distinct unknown
county state. API/network/invalid-response failures offer an in-page retry.

Name search is case insensitive and trims the query. The `q` URL parameter keeps
search shareable and restores it through browser navigation. Edits preserve other
parameters. Native links support keyboard access and new tabs. New pages use
focus outlines, labelled search, live statuses and reduced-motion styles. The grid
uses three, two or one columns according to viewport width.

The hook aborts on unmount/slug changes and ignores aborted responses. Its resource
and retry keys keep stale county details hidden while another county is loading.
Search does not trigger new API requests.

County metadata is the only county-specific content. Cards contain names/codes,
not inferred imagery, counts or attractions. Details explicitly explain that
destination guides are not yet available here, and link to the general Explore
catalogue without pretending to filter it by a county association.

## Verification

Run from frontend/: `npm test`, `npm run lint`, `npm run build`.
The 17 tests include the existing nine catalogue regressions and eight county
tests. They cover rendered loading/error/empty/404 states, all 47 returned cards,
name filtering, actual route registration, slug links, placeholder honesty,
API ordering, abort-signal forwarding, 404/500/network errors and invalid responses.
Tests use the existing Vite compiler, React server renderer and Node runner;
no dependencies were added.

These are service, pure-logic and static React rendering tests, not a mounted
browser interaction suite. Still manually verify keyboard traversal, mobile
layouts at 320px and tablet widths, browser Back/Forward, network throttling,
abort/retry behaviour and direct county detail reloads in the intended environment.

Integration requires the Sprint 3.1 API and a populated county foundation database.
Production state was not inspected. Confirm the existing API base URL, CORS and
SPA deep-link behaviour before any separately approved release. No backend,
migration, environment or deployment configuration changes are part of this sprint.
