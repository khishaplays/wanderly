const API_BASE_URL = import.meta.env.VITE_API_URL || "";

function isCounty(value) {
  return value && Number.isInteger(value.id) &&
    typeof value.code === "string" && /^0(0[1-9]|[1-3][0-9]|4[0-7])$/.test(value.code) &&
    typeof value.name === "string" && value.name.trim() !== "" &&
    typeof value.slug === "string" && value.slug.trim() !== "";
}

export async function getCounties(signal) {
  const response = await fetch(`${API_BASE_URL}/api/counties`, { signal });
  if (!response.ok) throw new Error(`Unable to load counties (${response.status})`);
  const data = await response.json();
  if (!Array.isArray(data) || !data.every(isCounty)) {
    throw new Error("Unexpected counties response");
  }
  return [...data].sort((a, b) => a.code.localeCompare(b.code));
}

export async function getCounty(slug, signal) {
  const response = await fetch(`${API_BASE_URL}/api/counties/${encodeURIComponent(slug)}`, { signal });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Unable to load county (${response.status})`);
  const data = await response.json();
  if (!isCounty(data)) throw new Error("Unexpected county response");
  return data;
}
