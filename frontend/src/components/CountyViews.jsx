import { Link } from "react-router-dom";
import CountyCard from "./CountyCard";
import SearchBar from "./SearchBar";
import { filterCounties } from "../utils/counties";

export function CountyState({ loading, error, retry }) {
  if (loading) return <div className="county-state" role="status"><span aria-hidden="true">◌</span><h2>Finding Kenya’s counties…</h2><p>A new place to begin your next journey.</p></div>;
  if (error) return <div className="county-state" role="alert"><h2>We couldn’t load county information.</h2><p>Please try again in a moment.</p><button type="button" className="filter-button" onClick={retry}>Try again</button></div>;
  return null;
}

export function CountyBrowser({ data, loading, error, retry, search, onSearch }) {
  const counties = filterCounties(data ?? [], search);
  return (
    <div className="county-page">
      <section className="county-hero">
        <p className="eyebrow">47 COUNTIES. ENDLESS CURIOSITY.</p>
        <h1>Discover <em>Kenya.</em></h1>
        <p>Start with a county. See where your curiosity takes you.</p>
        <SearchBar value={search} onChange={onSearch} label="Search counties by name" placeholder="Find a county…" />
      </section>
      <section className="county-results" aria-label="Kenya counties" aria-busy={loading}>
        {loading || error ? <CountyState loading={loading} error={error} retry={retry} /> : (
          <>
            <div className="county-results-heading"><h2>Your next starting point</h2><p role="status">{counties.length} {counties.length === 1 ? "county" : "counties"}</p></div>
            {data?.length === 0 ? <div className="county-state"><h2>County browsing is coming soon.</h2><p>County information isn’t available right now.</p><Link className="text-link" to="/explore">Explore destinations →</Link></div>
              : counties.length === 0 ? <div className="county-state"><h2>No counties matched.</h2><p>Try another name or clear your search.</p><button type="button" className="filter-button" onClick={() => onSearch("")}>Clear search</button></div>
                : <div className="county-grid">{counties.map((county) => <CountyCard key={county.id} county={county} />)}</div>}
          </>
        )}
      </section>
    </div>
  );
}

export function CountyDetailView({ data: county, loading, error, retry }) {
  return (
    <div className="county-page">
      <Link className="back-link" to="/counties">← All counties</Link>
      {loading || error ? <CountyState loading={loading} error={error} retry={retry} /> : !county ? (
        <section className="county-state"><h1>County not found.</h1><p>We couldn’t find a county at this address.</p><Link to="/counties" className="text-link">Discover Kenya →</Link></section>
      ) : (
        <>
          <section className="county-hero county-detail-hero"><p className="eyebrow">DISCOVER KENYA · COUNTY {county.code}</p><h1>{county.name}</h1><p>A place to begin your next chapter.</p></section>
          <section className="county-placeholder"><span className="county-placeholder-icon" aria-hidden="true">✦</span><p className="eyebrow">MORE TO DISCOVER</p><h2>A closer look is on the way.</h2><p>Destination guides for {county.name} aren’t available here yet. In the meantime, explore Wanderly’s destination catalogue for inspiration across Kenya.</p><Link to="/explore" className="hero-primary">Explore destinations across Kenya →</Link></section>
        </>
      )}
    </div>
  );
}
