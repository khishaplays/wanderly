import { useEffect, useState } from "react";
import { getDestinations } from "../services/destinations";
import { normalizeDestination } from "../utils/catalogue";

export function useDestinations() {
  const [state, setState] = useState({ destinations: [], loading: true, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    getDestinations(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ destinations: data.map(normalizeDestination), loading: false, error: "" });
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted) {
          setState({ destinations: [], loading: false, error: error.message });
        }
      });
    return () => controller.abort();
  }, []);

  return state;
}
