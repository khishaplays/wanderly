import assert from "node:assert/strict";
import "./counties.test.jsx";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import DestinationCard from "../src/components/DestinationCard";
import {
  normalizeDestination, featuredDestinations, filterDestinations,
  catalogueCategories, readFilters, updateFilters, formatDailyCost,
} from "../src/utils/catalogue";

const place = (overrides = {}) => normalizeDestination({
  id: 842, slug: "new-waterfall", name: "New Waterfall", county: "Nakuru",
  description: "A forest walk", categories: ["Nature", "Adventure"],
  ...overrides,
});
const renderCard = (destination) => renderToStaticMarkup(
  <MemoryRouter><DestinationCard destination={destination} /></MemoryRouter>,
);

test("new API categories work without adding a slug mapping", () => {
  const places = [place(), place({ id: 901, categories: ["Beach"] })];
  assert.deepEqual(filterDestinations(places, "", "Nature").map((p) => p.id), [842]);
  assert.deepEqual(filterDestinations(places, "NAKURU", "Beach").map((p) => p.id), [901]);
  assert.equal(filterDestinations(places, "waterfall", "Culture").length, 0);
  assert.deepEqual(catalogueCategories(places), ["Adventure", "Beach", "Nature"]);
});

test("API categories including empty arrays override legacy mappings", () => {
  assert.deepEqual(place({ slug: "lamu", categories: [] }).categories, []);
  assert.deepEqual(place({ slug: "lamu", categories: ["Museum"] }).categories, ["Museum"]);
});

test("legacy list and detail records receive the same fallback categories", () => {
  const legacy = place({ slug: "lamu", categories: undefined });
  assert.ok(legacy.categories.includes("History"));
  assert.equal(filterDestinations([legacy], "", "History").length, 1);
  assert.deepEqual(place({ categories: undefined }).categories, []);
});

test("featured cards link to actual API IDs rather than fixture IDs", () => {
  const records = [place(), place({ id: 901 }), place({ id: 1700 }), place({ id: 2000 })];
  const featured = featuredDestinations(records);
  assert.deepEqual(featured.map((p) => p.id), [842, 901, 1700]);
  for (const destination of featured) {
    assert.ok(renderCard(destination).includes(`href="/destinations/${destination.id}"`));
  }
  assert.deepEqual(featuredDestinations([]), []);
});

test("missing and null prices render unavailable, never a zero estimate", () => {
  for (const destination of [place(), place({ estimated_daily_cost: null })]) {
    assert.equal(destination.estimatedDailyCost, null);
    const html = renderCard(destination);
    assert.ok(html.includes("Price unavailable"));
    assert.ok(!html.includes("KSh 0"));
    assert.equal(formatDailyCost(destination.estimated_daily_cost), "Not available");
  }
});

test("an explicit zero is preserved and known prices use the same formatter", () => {
  assert.ok(renderCard(place({ estimated_daily_cost: 0 })).includes("From KSh 0/day"));
  assert.ok(renderCard(place({ estimated_daily_cost: 8500 })).includes("From KSh 8,500/day"));
  assert.equal(formatDailyCost(8500), "KSh 8,500");
});

test("URL search and category initialize and restore filters", () => {
  const categories = ["Beach", "Nature"];
  const params = new URLSearchParams("q=Nakuru&category=nature");
  const filters = readFilters(params, categories);
  assert.deepEqual(filters, { search: "Nakuru", category: "Nature" });
  assert.equal(filterDestinations([place()], filters.search, filters.category).length, 1);
  assert.deepEqual(readFilters(new URLSearchParams("q=coast&category=beach"), categories),
    { search: "coast", category: "Beach" });
  // Reading the previous URL again restores its original selection.
  assert.deepEqual(readFilters(params, categories), filters);
});

test("legacy style links work and unsupported audience styles do not hide all results", () => {
  assert.equal(readFilters(new URLSearchParams("style=history"), ["History"]).category, "History");
  for (const style of ["solo", "family", "study", "unknown"]) {
    assert.equal(readFilters(new URLSearchParams({ style }), ["Nature"]).category, "All");
  }
});

test("filter edits and clearing preserve unrelated parameters and canonicalize style", () => {
  const original = new URLSearchParams("style=beach&q=coast&ref=home");
  const changed = updateFilters(original, { q: "Diani" });
  assert.equal(changed.get("category"), "beach");
  assert.equal(changed.get("q"), "Diani");
  assert.equal(changed.has("style"), false);
  assert.equal(original.get("q"), "coast");
  const cleared = updateFilters(changed, { q: "", category: "All" });
  assert.equal(cleared.toString(), "ref=home");
});
