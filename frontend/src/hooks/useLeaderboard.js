import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api/client";

// Shared by MilestoneBar (needs total_raised_cents/funding_goal_cents) and
// Leaderboard (needs entries) so the page only fetches /api/leaderboard/
// once instead of each component fetching its own copy.
export default function useLeaderboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    // Default auth (attaches the token if one exists) so `is_self` on each
    // entry reflects the logged-in user -- the endpoint itself is AllowAny,
    // so signed-out visitors still get the full public leaderboard.
    return apiFetch("/leaderboard/")
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
