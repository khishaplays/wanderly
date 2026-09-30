import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import DestinationCard from "../components/DestinationCard";
import SearchBar from "../components/SearchBar";

import { destinations } from "../data/destinations";
import { experiences } from "../data/experiences";

function Explore() {
  const [searchParams] = useSearchParams();

  const selectedStyle = searchParams.get("style");

  const initialExperience = selectedStyle
    ? selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)
    : "All";

  const [search, setSearch] = useState("");
  const [experience, setExperience] = useState(initialExperience);

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
        .join(" ")
        .toLowerCase();

      const matchesSearch = query === "" || searchableText.includes(query);

      const matchesExperience =
        experience === "All" || destination.categories.includes(experience);

      return matchesSearch && matchesExperience;
    });
  }, [search, experience]);

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
            {filteredDestinations.length}{" "}
            {filteredDestinations.length === 1 ? "place" : "places"}
          </p>
        </div>

        {filteredDestinations.length > 0 ? (
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
