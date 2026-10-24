import { useSearchParams } from "react-router-dom";

import DestinationCard from "../components/DestinationCard";
import SearchBar from "../components/SearchBar";
import { useDestinations } from "../hooks/useDestinations";
import { catalogueCategories, readFilters, updateFilters, filterDestinations } from "../utils/catalogue";

function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { destinations, loading, error } = useDestinations();
  const categories = catalogueCategories(destinations);
  const { search, category: experience } = readFilters(searchParams, categories);
  const filteredDestinations = filterDestinations(destinations, search, experience);

  function setFilter(updates, replace = false) {
    setSearchParams((current) => updateFilters(current, updates), { replace });
  }

  function clearFilters() {
    setFilter({ q: "", category: "" });
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

        <SearchBar value={search} onChange={(value) => setFilter({ q: value }, true)} />
      </section>

      <section className="explore-content">
        <div className="filter-header">
          <div className="category-filters">
            {["All", ...categories].map((item) => (
              <button
                key={item}
                type="button"
                className={
                  experience === item
                    ? "filter-button active-filter"
                    : "filter-button"
                }
                aria-pressed={experience === item}
                onClick={() => setFilter({ category: item })}
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
