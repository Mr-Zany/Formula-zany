// Section 9a (colors) + Section 9's dismiss-behavior rule (login/away
// notices persist, live/action notices auto-dismiss after 7s -- moderation
// is the one explicit exception, persistent either way) + Section 7a
// (which toggle, if any, can suppress this type). One table instead of
// scattering these rules across every call site.
//
// gate: "live" | "away" | "all-only" | "never"
//   "live"     -> suppressed by disable_live_notifications
//   "away"     -> suppressed by disable_away_notifications
//   "all-only" -> suppressed only by disable_all_notifications (7a: this is
//                 the profile pic/display name *success* carve-out -- the
//                 other two toggles don't cover it alone)
//   "never"    -> always shown, regardless of any toggle (7a hard rule, or
//                 simply not covered by the toggle table at all)
export const NOTIFICATION_CONFIG = {
  account_created: { color: "green", dismiss: "persistent", gate: "never" },
  sign_in: { color: "green", dismiss: "persistent", gate: "never" },
  sign_out: { color: "gray", dismiss: "persistent", gate: "never" },

  rank_dropped_away: { color: "amber", dismiss: "persistent", gate: "away" },
  referral_catchup: { color: "purple", dismiss: "persistent", gate: "away" },
  reached_gold_away: { color: "green", dismiss: "persistent", gate: "away" },
  reached_top3_away: { color: "green", dismiss: "persistent", gate: "away" },
  moderation_takedown: { color: "red", dismiss: "persistent", gate: "never" },

  live_placement_drop: { color: "amber", dismiss: "timed", gate: "live" },
  live_referral_toast: { color: "purple", dismiss: "timed", gate: "live" },
  reached_gold_live: { color: "green", dismiss: "timed", gate: "live" },
  reached_top3_live: { color: "green", dismiss: "timed", gate: "live" },
  donation_received_up: { color: "blue", dismiss: "timed", gate: "live" },
  donation_received_same: { color: "blue", dismiss: "timed", gate: "live" },

  profile_picture_success: { color: "gray", dismiss: "timed", gate: "all-only" },
  profile_picture_failed: { color: "red", dismiss: "timed", gate: "never" },
  display_name_success: { color: "gray", dismiss: "timed", gate: "all-only" },
  display_name_failed: { color: "red", dismiss: "timed", gate: "never" },
  password_reset_success: { color: "gray", dismiss: "timed", gate: "never" },
  password_reset_expired: { color: "red", dismiss: "timed", gate: "never" },
  donation_failed: { color: "red", dismiss: "timed", gate: "never" },
};

export const TIMED_DISMISS_MS = 7000;
export const LIVE_PLACEMENT_DROP_RATE_LIMIT_MS = 60000;

// Away-events that arrived together from one login-events response combine
// into a single banner (Section 9: "bundle into a single combined banner
// rather than stacking multiple notices") -- sign-in/account-created and
// moderation are excluded, they always stand alone.
export const COMBINABLE_AWAY_TYPES = new Set([
  "rank_dropped_away",
  "referral_catchup",
  "reached_gold_away",
  "reached_top3_away",
]);

export function isSuppressed(type, user) {
  const gate = NOTIFICATION_CONFIG[type]?.gate;
  if (!user || gate === "never" || !gate) return false;
  if (user.disable_all_notifications) {
    // "all" always suppresses "all-only" success notices, and cascades to
    // both live+away server-side already -- but a client can briefly hold a
    // stale profile object where the cascade hasn't landed yet, so check
    // all three explicitly rather than relying only on disable_all.
    return true;
  }
  if (gate === "live") return user.disable_live_notifications;
  if (gate === "away") return user.disable_away_notifications;
  if (gate === "all-only") return false;
  return false;
}
