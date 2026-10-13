// Fetch all destinations for the Explore page
export async function getDestinations(signal) {
  const response = await fetch("/api/destinations", {
    signal,
  });

  if (!response.ok) {
    throw new Error(
      `Unable to load destinations (${response.status})`
    );
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Unexpected destinations response");
  }

  return data;
}

// Fetch one destination and its activities
export async function getDestination(id, signal) {
  const response = await fetch(
    `/api/destinations/${encodeURIComponent(id)}`,
    { signal }
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Unable to load destination (${response.status})`
    );
  }

  return response.json();
}