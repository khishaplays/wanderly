import { Link } from "react-router-dom";
import { useDestinations } from "../hooks/useDestinations";
import { featuredDestinations as selectFeatured } from "../utils/catalogue";
import DestinationCard from "../components/DestinationCard";

const travelStyles = [
  {
    icon: "🦁",
    title: "Safari",
    text: "Meet Kenya's wild side.",
  },
  {
    icon: "🏖️",
    title: "Beach",
    text: "Find your place on the coast.",
  },
  {
    icon: "🎒",
    title: "Solo",
    text: "Wander at your own pace.",
  },
  {
    icon: "💑",
    title: "Couples",
    text: "Plan something unforgettable.",
  },
  {
    icon: "👨‍👩‍👧",
    title: "Family",
    text: "Adventures for everyone.",
  },
  {
    icon: "🎓",
    title: "Study",
    text: "Make Kenya feel like home.",
  },
];

function Home() {
  const { destinations, loading, error } = useDestinations();
  const featuredDestinations = selectFeatured(destinations);

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <p className="eyebrow">WANDERLY KENYA</p>

          <h1>
            Meet Kenya
            <br />
            <span>beyond the postcard.</span>
          </h1>

          <p className="hero-description">
            Safari at sunrise. Coastlines at sunset. Cities, culture, food and
            stories in between. Discover, plan and experience Kenya your way.
          </p>

          <div className="hero-actions">
            <Link to="/explore" className="hero-primary">
              Explore Kenya
            </Link>

            <a href="#planning" className="hero-secondary">
              Plan your journey ↓
            </a>
          </div>
        </div>

        <div className="hero-art">
          <div className="sun" />

          <div className="travel-card card-one">
            <span>🦁</span>

            <div>
              <small>WILD KENYA</small>
              <strong>Maasai Mara</strong>
            </div>
          </div>

          <div className="travel-card card-two">
            <span>🌊</span>

            <div>
              <small>THE COAST</small>
              <strong>Diani Beach</strong>
            </div>
          </div>

          <div className="travel-card card-three">
            <span>🌆</span>

            <div>
              <small>CITY STORIES</small>
              <strong>Nairobi</strong>
            </div>
          </div>

          <div className="hero-note">
            <span>✦</span>
            Made for curious travelers
          </div>
        </div>
      </section>

      {/* TRAVEL STYLES */}
      <section className="planning-section" id="planning">
        <div className="section-heading">
          <div>
            <p className="eyebrow">MAKE IT YOURS</p>
            <h2>What brings you to Kenya?</h2>
          </div>

          <p>Wanderly adapts to the kind of experience you're looking for.</p>
        </div>

        <div className="travel-style-grid">
          {travelStyles.map((style) => (
            <Link
              key={style.title}
              to={["Safari", "Beach"].includes(style.title)
                ? `/explore?category=${style.title.toLowerCase()}`
                : "/explore"}
              className="style-card"
            >
              <span className="style-icon">{style.icon}</span>

              <h3>{style.title}</h3>

              <p>{style.text}</p>

              <span className="card-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED DESTINATIONS */}
      <section className="featured-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">START WANDERING</p>
            <h2>A little taste of Kenya.</h2>
          </div>

          <Link to="/explore" className="text-link">
            See all destinations →
          </Link>
        </div>

        {loading ? (
          <p role="status">Loading featured destinations...</p>
        ) : error ? (
          <div role="alert">
            <p>We couldn't load featured destinations.</p>
            <Link to="/explore" className="text-link">Try Explore →</Link>
          </div>
        ) : featuredDestinations.length === 0 ? (
          <p>Destinations are coming soon.</p>
        ) : (
          <div className="destination-grid">
            {featuredDestinations.map((destination) => (
              <DestinationCard key={destination.id} destination={destination} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default Home;
