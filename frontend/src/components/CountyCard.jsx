import { Link } from "react-router-dom";
import { countyPath } from "../utils/counties";

export default function CountyCard({ county }) {
  return (
    <Link to={countyPath(county)} className="county-card">
      <span className="county-code">COUNTY {county.code}</span>
      <h2>{county.name}</h2>
      <span className="county-card-footer">Discover county <span aria-hidden="true">↗</span></span>
    </Link>
  );
}
