// Compatibility fallback for the current API, which has no persisted categories.
// Remove category fallbacks after the approved migration and API rollout.
const legacyStyles = {
  "maasai-mara": {
    emoji: "🦁",
    categories: ["Safari", "Wildlife", "Culture"],
  },
  "diani-beach": {
    emoji: "🏖️",
    categories: ["Beach", "Adventure"],
  },
  nairobi: {
    emoji: "🏙️",
    categories: ["City", "Culture", "Nightlife", "Wildlife"],
  },
  lamu: {
    emoji: "⛵",
    categories: ["Culture", "Beach", "History"],
  },
  naivasha: {
    emoji: "🌿",
    categories: ["Nature", "Adventure", "Wildlife"],
  },
  mombasa: {
    emoji: "🌊",
    categories: ["Beach", "Culture", "Food"],
  },
};


export function normalizeDestination(destination) {
  const fallback = legacyStyles[destination.slug];
  return {
    ...destination,
    categories: Array.isArray(destination.categories)
      ? destination.categories
      : (fallback?.categories ?? []),
    emoji: destination.emoji ?? fallback?.emoji ?? "📍",
    estimatedDailyCost: destination.estimated_daily_cost ?? null,
  };
}

export function featuredDestinations(destinations) {
  return destinations.slice(0, 3);
}

export function destinationPath(destination) {
  return `/destinations/${encodeURIComponent(destination.id)}`;
}

export function formatDailyCost(value) {
  return value == null ? "Not available" : `KSh ${value.toLocaleString("en-KE")}`;
}

export function catalogueCategories(destinations) {
  return [...new Set(destinations.flatMap((destination) => destination.categories))]
    .sort((a, b) => a.localeCompare(b));
}

export function readFilters(params, categories) {
  const requested = params.get("category") ?? params.get("style") ?? "";
  return {
    search: params.get("q") ?? "",
    category: categories.find((item) => item.toLowerCase() === requested.toLowerCase()) ?? "All",
  };
}

export function updateFilters(params, updates) {
  const next = new URLSearchParams(params);
  // Canonicalize legacy style links when editing either filter.
  if (!next.has("category") && next.has("style")) {
    next.set("category", next.get("style"));
  }
  next.delete("style");
  for (const [key, value] of Object.entries(updates)) {
    if (!value || value === "All") next.delete(key);
    else next.set(key, value);
  }
  return next;
}

export function filterDestinations(destinations, search, category) {
  const query = search.trim().toLowerCase();
  return destinations.filter((destination) => {
    const text = [destination.name, destination.county, destination.region,
      destination.tagline, destination.description, ...destination.categories]
      .filter(Boolean).join(" ").toLowerCase();
    return (!query || text.includes(query)) &&
      (category === "All" || destination.categories.includes(category));
  });
}
