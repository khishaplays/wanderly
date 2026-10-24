import { useParams } from "react-router-dom";
import { useCountyData } from "../hooks/useCountyData";
import { CountyDetailView } from "../components/CountyViews";

export default function CountyDetails() {
  const { county_slug } = useParams();
  const state = useCountyData(county_slug);
  return <CountyDetailView {...state} />;
}
