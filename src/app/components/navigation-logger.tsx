import { useEffect } from "react";
import { useLocation, useNavigation } from "react-router"; // or "react-router-dom"

export function NavigationLogger() {
  // 1. Track the current URL location
  const location = useLocation();

  // 2. (Optional) Track the navigation lifecycle state (idle, loading, submitting)
  const navigation = useNavigation();

  useEffect(() => {
    // Log the full location object (pathname, search, hash, state)
    console.group(`📍 Navigation: ${location.pathname}`);
    console.log("Full Location:", location);
    console.log("Search Params:", location.search);
    console.log("State:", location.state);
    console.groupEnd();
  }, [location]);

  // Optional: Log transition states (e.g., when a loader is running)
  useEffect(() => {
    if (navigation.state !== "idle") {
      console.log(`🔄 Navigation State: ${navigation.state}`);
    }
  }, [navigation.state]);

  return null; // This component renders nothing
}
