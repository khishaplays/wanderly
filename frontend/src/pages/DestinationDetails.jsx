import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { normalizeDestination, formatDailyCost } from "../utils/catalogue";
import { getDestination } from "../services/destinations";

const activityEmojis = {
  Safari: "🦁",
  Culture: "🎭",
  Beach: "🏖️",
  Adventure: "🤿",
  Wildlife: "🦒",
};

function DestinationDetails() {
  const { id } = useParams();

  const [destination, setDestination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadDestination() {
      try {
        setLoading(true);
        setError("");
        setDestination(null);

        const data = await getDestination(id, controller.signal);

        if (!controller.signal.aborted) {
          setDestination(data ? normalizeDestination(data) : null);
        }
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

    loadDestination();

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <section className="destination-not-found" role="status">
        <span>🌍</span>
        <h1>Finding your next adventure...</h1>
        <p>Loading destination details.</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="destination-not-found" role="alert">
        <span>⚠️</span>
        <h1>We couldn't load this destination.</h1>
        <p>{error}</p>
        <Link to="/explore" className="hero-primary">
          Back to Explore
        </Link>
      </section>
    );
  }

  if (!destination) {
    return (
      <section className="destination-not-found">
        <span>🧭</span>
        <h1>We couldn't find that place.</h1>
        <p>The destination may not exist in Wanderly yet.</p>
        <Link to="/explore" className="hero-primary">
          Explore Kenya
        </Link>
      </section>
    );
  }

  const destinationActivities = destination.activities ?? [];

  const dailyCost = destination.estimated_daily_cost;

  return (
    <div className="destination-page">
      <section className="destination-detail-hero">
        <div className="destination-detail-copy">
          <Link to="/explore" className="back-link">
            ← Explore Kenya
          </Link>

          <p className="eyebrow">
            {destination.county} COUNTY • {destination.region}
          </p>

          <h1>{destination.name}</h1>

          <p className="destination-tagline">{destination.tagline}</p>

          <div className="destination-tags">
            {destination.categories.map((category) => (
              <span key={category}>{category}</span>
            ))}
          </div>
        </div>

        <div className="destination-detail-art">
          <span>{destination.emoji}</span>
        </div>
      </section>

      <section className="destination-info">
        <div className="destination-main">
          <div className="destination-section">
            <p className="eyebrow">DISCOVER</p>
            <h2>Why wander here?</h2>

            <p className="destination-description">{destination.description}</p>
          </div>

          <div className="destination-section">
            <div className="section-heading compact-heading">
              <div>
                <p className="eyebrow">THINGS TO DO</p>
                <h2>Make a day of it.</h2>
              </div>
            </div>

            {destinationActivities.length > 0 ? (
              <div className="activity-grid">
                {destinationActivities.map((activity) => (
                  <article className="activity-card" key={activity.id}>
                    <div className="activity-icon">
                      {activityEmojis[activity.category] ?? "✨"}
                    </div>

                    <div>
                      <span className="activity-category">
                        {activity.category}
                      </span>

                      <h3>{activity.name}</h3>

                      <p>{activity.description}</p>

                      <div className="activity-meta">
                        <span>⏱ {activity.duration ?? "Flexible"}</span>

                        <span>
                          {activity.estimated_cost == null
                            ? "Cost not available"
                            : activity.estimated_cost === 0
                              ? "Free"
                              : `Est. KSh ${activity.estimated_cost.toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="coming-soon">
                <span>✦</span>
                <div>
                  <h3>More local experiences are coming.</h3>
                  <p>
                    We're still adding activities and places for{" "}
                    {destination.name}.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="destination-section">
            <p className="eyebrow">GOOD TO KNOW</p>
            <h2>Before you wander.</h2>

            <div className="visitor-tip-grid">
              <div className="visitor-tip">
                <span>💵</span>
                <h3>Currency</h3>
                <p>Kenyan Shilling (KES)</p>
              </div>

              <div className="visitor-tip">
                <span>💬</span>
                <h3>Languages</h3>
                <p>English & Kiswahili</p>
              </div>

              <div className="visitor-tip">
                <span>📍</span>
                <h3>County</h3>
                <p>{destination.county}</p>
              </div>
            </div>
          </div>
        </div>

        <aside className="trip-panel">
          <p className="eyebrow">PLAN YOUR STAY</p>

          <h2>{destination.name}</h2>

          <div className="cost-block">
            <span>Estimated daily budget</span>

            <strong>
              {formatDailyCost(dailyCost)}
            </strong>

            <small>per traveler / day</small>
          </div>

          <button type="button" className="plan-trip-button">
            + Add to trip
          </button>

          <button type="button" className="save-button">
            ♡ Save destination
          </button>

          <p className="estimate-note">
            Wanderly estimates are for planning purposes and may vary.
          </p>
        </aside>
      </section>
    </div>
  );
}

export default DestinationDetails;
