import { useEffect, useState } from "react";
import { getCounties, getCounty } from "../services/counties";

export function useCountyData(slug) {
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);
  useEffect(() => {
    const controller = new AbortController();
    const request = slug === undefined ? getCounties(controller.signal) : getCounty(slug, controller.signal);
    request.then((data) => {
      if (!controller.signal.aborted) setResult({ slug, attempt, data, error: "" });
    }).catch(() => {
      if (!controller.signal.aborted) setResult({ slug, attempt, data: null, error: "Unable to load county information." });
    });
    return () => controller.abort();
  }, [slug, attempt]);
  const current = result?.slug === slug && result?.attempt === attempt;
  return {
    data: current ? result.data : null,
    error: current ? result.error : "",
    loading: !current,
    retry: () => setAttempt((value) => value + 1),
  };
}
