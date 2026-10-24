import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { CountyBrowser, CountyDetailView } from "../src/components/CountyViews";
import { filterCounties, countyPath } from "../src/utils/counties";
import { getCounties, getCounty } from "../src/services/counties";
import App from "../src/App";

const county = { id: 842, code: "047", name: "Nairobi City", slug: "nairobi-city" };
const rows = [county, { id: 901, code: "001", name: "Mombasa", slug: "mombasa" }];
const noop = () => {};
const render = (view, path = "/counties") => renderToStaticMarkup(<MemoryRouter initialEntries={[path]}>{view}</MemoryRouter>);
const browser = (props = {}) => render(<CountyBrowser data={rows} loading={false} error="" retry={noop} search="" onSearch={noop} {...props} />);

test("county loading, error, unavailable and empty-search states are distinct", () => {
  assert.match(browser({ loading: true }), /role="status"/);
  assert.doesNotMatch(browser({ loading: true }), /county-card"/);
  assert.match(browser({ error: "failure" }), /role="alert"/);
  assert.match(browser({ error: "failure" }), /Try again/);
  assert.match(browser({ data: [] }), /County browsing is coming soon/);
  assert.match(browser({ search: "missing" }), /No counties matched/);
  assert.match(browser({ search: "missing" }), /Clear search/);
});

test("county rendering uses API names, codes and slug links", () => {
  const html = browser();
  assert.match(html, /COUNTY 047/);
  assert.match(html, /Nairobi City/);
  assert.match(html, /href="\/counties\/nairobi-city"/);
  assert.match(html, /Search counties by name/);
  assert.doesNotMatch(html, /attractions|KSh|<img/);
  assert.equal(countyPath({ slug: "test/path" }), "/counties/test%2Fpath");
});

test("all 47 returned county records render without truncation", () => {
  // Synthetic names test grid capacity; they are never application data.
  const data = Array.from({ length: 47 }, (_, i) => ({ id: i+100, code: String(i+1).padStart(3, "0"), name: `Test county ${i}`, slug: `test-${i}` }));
  assert.equal((browser({ data }).match(/class="county-card"/g) ?? []).length, 47);
});

test("county search is trimmed and case insensitive and filters names only", () => {
  assert.deepEqual(filterCounties(rows, " NAIROBI "), [county]);
  assert.deepEqual(filterCounties(rows, ""), rows);
  assert.deepEqual(filterCounties(rows, "047"), []);
  assert.doesNotMatch(browser({ search: "nairobi" }), /COUNTY 001/);
});

test("county details expose metadata and an honest destination placeholder", () => {
  const html = render(<CountyDetailView data={county} />);
  assert.match(html, /Nairobi City/);
  assert.match(html, /COUNTY 047/);
  assert.match(html, /aren’t available here yet/);
  assert.match(html, /href="\/explore"/);
  assert.match(html, /href="\/counties"/);
  assert.doesNotMatch(html, /KSh|<img|destination-card/);
  assert.match(render(<CountyDetailView data={null} />), /County not found/);
  assert.match(render(<CountyDetailView loading />), /Finding Kenya/);
  assert.match(render(<CountyDetailView error="failed" retry={noop} />), /role="alert"/);
});

test("real county routes and Discover Kenya navigation are registered", () => {
  assert.match(render(<App />, "/counties"), /Discover <em>Kenya/);
  assert.match(render(<App />, "/counties/nairobi-city"), /All counties/);
  assert.match(render(<App />, "/counties"), /href="\/counties"[^>]*>Discover Kenya/);
  assert.match(render(<App />, "/explore?category=beach&q=coast"), /value="coast"/);
});

test("county API service orders records, encodes slugs and forwards abort signals", async () => {
  const original = globalThis.fetch;
  const controller = new AbortController();
  const calls = [];
  globalThis.fetch = async (url, options) => { calls.push({ url, options }); return { ok: true, json: async () => url.endsWith("/api/counties") ? rows : county }; };
  try {
    assert.deepEqual((await getCounties(controller.signal)).map((c) => c.code), ["001", "047"]);
    assert.deepEqual(await getCounty("test/path", controller.signal), county);
    assert.match(calls[1].url, /\/api\/counties\/test%2Fpath$/);
    assert.equal(calls[0].options.signal, controller.signal);
  } finally { globalThis.fetch = original; }
});

test("county API failures, malformed data and 404 are handled separately", async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 404 });
    assert.equal(await getCounty("unknown"), null);
    await assert.rejects(getCounties(), /404/);
    globalThis.fetch = async () => ({ ok: false, status: 500 });
    await assert.rejects(getCounty("nairobi-city"), /500/);
    globalThis.fetch = async () => { throw new Error("offline"); };
    await assert.rejects(getCounties(), /offline/);
    for (const data of [{ counties: rows }, [null], [{ ...county, code: "048" }]]) {
      globalThis.fetch = async () => ({ ok: true, json: async () => data });
      await assert.rejects(getCounties(), /Unexpected counties/);
    }
    globalThis.fetch = async () => ({ ok: true, json: async () => null });
    await assert.rejects(getCounty("unknown"), /Unexpected county/);
  } finally { globalThis.fetch = original; }
});
