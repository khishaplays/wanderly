import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import DestinationCard from "../components/DestinationCard";
import SearchBar from "../components/SearchBar";
import { experiences } from "../data/experiences";
import { getDestinations } from "../services/destinations";

const categoryBySlug = {
  "maasai-mara": ["Safari", "Wildlife", "Culture"],
  "diani-beach": ["Beach", "Adventure"],
  nairobi: ["City", "Culture", "Nightlife", "Wildlife"],
  lamu: ["Culture", "Beach"],
  naivasha: ["Nature", "Adventure", "Wildlife"],
  mombasa: ["Beach", "Culture", "Food"],
};

const emojiBySlug = {
  "maasai-mara": "🦁",
  "diani-beach": "🏖️",
  nairobi: "🏙️",
  lamu: "⛵",
  naivasha: "🌿",
  mombasa: "🌊",
};

function normalizeDestination(destination) {
  return {
    ...destination,
    categories: categoryBySlug[destination.slug] ?? [],
    emoji: emojiBySlug[destination.slug] ?? "📍",
    estimatedDailyCost: destination.estimated_daily_cost ?? 0,
  };
}

function Explore() {
  const [searchParams] = useSearchParams();

  const selectedStyle = searchParams.get("style");

  const initialExperience = selectedStyle
    ? selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)
    : "All";

  const [search, setSearch] = useState("");
  const [experience, setExperience] = useState(initialExperience);

  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDestinations() {
      try {
        setLoading(true);
        setError("");

        const data = await getDestinations(controller.signal);

        setDestinations(data.map(normalizeDestination));
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadDestinations();

    return () => controller.abort();
  }, []);

  const filteredDestinations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return destinations.filter((destination) => {
      const searchableText = [
        destination.name,
        destination.county,
        destination.region,
        destination.tagline,
        destination.description,
        ...destination.categories,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = query === "" || searchableText.includes(query);

      const matchesExperience =
        experience === "All" || destination.categories.includes(experience);

      return matchesSearch && matchesExperience;
    });
  }, [destinations, search, experience]);

  function clearFilters() {
    setSearch("");
    setExperience("All");
  }

  return (
    <div className="explore-page">
      <section className="explore-hero">
        <p className="eyebrow">EXPLORE KENYA</p>

        <h1>
          Find your corner
          <br />
          <span>of Kenya.</span>
        </h1>

        <p>
          Search destinations, counties and experiences across Kenya — from
          safari and beaches to food, culture and nightlife.
        </p>

        <SearchBar value={search} onChange={setSearch} />
      </section>

      <section className="explore-content">
        <div className="filter-header">
          <div className="category-filters">
            {experiences.map((item) => (
              <button
                key={item}
                type="button"
                className={
                  experience === item
                    ? "filter-button active-filter"
                    : "filter-button"
                }
                onClick={() => setExperience(item)}
              >
                {item}
              </button>
            ))}
          </div>

          <p>
            {loading
              ? "Loading places..."
              : `${filteredDestinations.length} ${
                  filteredDestinations.length === 1 ? "place" : "places"
                }`}
          </p>
        </div>

        {loading ? (
          <div className="empty-state" role="status">
            <span>🌍</span>
            <h2>Discovering Kenya...</h2>
            <p>Fetching destinations for your next adventure.</p>
          </div>
        ) : error ? (
          <div className="empty-state" role="alert">
            <span>⚠️</span>
            <h2>We couldn't load destinations.</h2>
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        ) : filteredDestinations.length > 0 ? (
          <div className="destination-grid">
            {filteredDestinations.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span>🧭</span>
            <h2>Nothing matched that search.</h2>
            <p>Try another destination, county or experience.</p>
            <button type="button" onClick={clearFilters}>
              Explore all Kenya
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

export default Explore;
