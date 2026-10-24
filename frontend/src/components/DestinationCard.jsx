import { Link } from "react-router-dom";

import { destinationPath, formatDailyCost } from "../utils/catalogue";

function DestinationCard({ destination }) {
  const {
    name,
    county,
    region,
    categories,
    emoji,
    description,
    estimatedDailyCost,
  } = destination;

  return (
    <Link to={destinationPath(destination)} className="destination-card">
      <div className="destination-image">
        <span className="destination-emoji">{emoji}</span>

        {categories.length > 0 && <span className="destination-category">{categories[0]}</span>}
      </div>

      <div className="destination-content">
        <span className="destination-location">
          {county} County • {region}
        </span>

        <h3>{name}</h3>

        <p>{description}</p>

        <div className="destination-tags">
          {categories.slice(0, 3).map((category) => (
            <span key={category}>{category}</span>
          ))}
        </div>

        <div className="destination-footer">
          <span>{estimatedDailyCost == null
            ? "Price unavailable"
            : `From ${formatDailyCost(estimatedDailyCost)}/day`}</span>

          <span>Explore →</span>
        </div>
      </div>
    </Link>
  );
}

export default DestinationCard;
