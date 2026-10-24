import { useSearchParams } from "react-router-dom";
import { useCountyData } from "../hooks/useCountyData";
import { CountyBrowser } from "../components/CountyViews";

export default function Counties() {
  const state = useCountyData();
  const [params, setParams] = useSearchParams();
  function onSearch(value) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set("q", value);
      else next.delete("q");
      return next;
    }, { replace: true });
  }
  return <CountyBrowser {...state} search={params.get("q") ?? ""} onSearch={onSearch} />;
}
