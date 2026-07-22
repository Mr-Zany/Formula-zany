import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import {
  FIXED_MESSAGES,
  pickAwayRankDroppedMessage,
  pickDonationReceivedSameMessage,
  pickDonationReceivedUpMessage,
  pickLivePlacementDropMessage,
  pickLiveReferralToastMessage,
  pickReachedGoldMessage,
  pickReachedTop3Message,
  pickReferralCatchupMessage,
} from "../data/messagePools";
import { COMBINABLE_AWAY_TYPES, NOTIFICATION_CONFIG, TIMED_DISMISS_MS, isSuppressed } from "./config";

const TIER_LABEL = { gold: "Gold", silver: "Silver", bronze: "Bronze", unranked: "Unranked" };

const NotificationContext = createContext(null);

function resolveMessage(type, vars) {
  switch (type) {
    case "account_created":
      return FIXED_MESSAGES.accountCreated;
    case "sign_in":
      return FIXED_MESSAGES.signIn;
    case "sign_out":
      return FIXED_MESSAGES.signOut;
    case "moderation_takedown":
      return FIXED_MESSAGES.moderationTakedown;
    case "rank_dropped_away":
      return pickAwayRankDroppedMessage({
        oldTier: TIER_LABEL[vars.old_tier] || vars.old_tier,
        newTier: TIER_LABEL[vars.new_tier] || vars.new_tier,
      });
    case "referral_catchup":
      return pickReferralCatchupMessage(vars.count);
    case "reached_gold_away":
    case "reached_gold_live":
      return pickReachedGoldMessage();
    case "reached_top3_away":
    case "reached_top3_live":
      return pickReachedTop3Message();
    case "live_placement_drop":
      return pickLivePlacementDropMessage(vars);
    case "live_referral_toast":
      return pickLiveReferralToastMessage();
    case "donation_received_up":
      return pickDonationReceivedUpMessage({ ...vars, tier: TIER_LABEL[vars.tier] || vars.tier });
    case "donation_received_same":
      return pickDonationReceivedSameMessage({ ...vars, tier: TIER_LABEL[vars.tier] || vars.tier });
    case "profile_picture_success":
      return FIXED_MESSAGES.profilePictureUpdateSuccess;
    case "profile_picture_failed":
      return FIXED_MESSAGES.profilePictureUpdateFailed;
    case "display_name_success":
      return FIXED_MESSAGES.displayNameUpdateSuccess;
    case "display_name_failed":
      return FIXED_MESSAGES.displayNameUpdateFailed;
    case "password_reset_success":
      return FIXED_MESSAGES.passwordResetSuccess;
    case "password_reset_expired":
      return FIXED_MESSAGES.passwordResetExpired;
    case "donation_failed":
      return FIXED_MESSAGES.donationFailed;
    default:
      return "";
  }
}

let nextId = 1;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismissNotification = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
  }, []);

  const addToast = useCallback(
    (entries) => {
      const id = nextId++;
      const dismiss = entries.some((e) => e.dismiss === "persistent") ? "persistent" : "timed";
      const celebration = entries.some((e) => e.celebration);
      const toast = {
        id,
        color: entries[0].color,
        dismiss,
        celebration,
        lines: entries.map((e) => e.message),
      };
      setToasts((prev) => [toast, ...prev]);
      if (dismiss === "timed") {
        timersRef.current[id] = setTimeout(() => dismissNotification(id), TIMED_DISMISS_MS);
      }
      return id;
    },
    [dismissNotification]
  );

  // Pushes a single event (used by live checks and directly-triggered
  // client-side events like sign in/out).
  const pushNotification = useCallback(
    (type, vars = {}) => {
      if (isSuppressed(type, user)) return null;
      const config = NOTIFICATION_CONFIG[type];
      if (!config) return null;
      const message = resolveMessage(type, vars);
      if (!message) return null;
      return addToast([
        { color: config.color, dismiss: config.dismiss, celebration: config.celebration, message },
      ]);
    },
    [user, addToast]
  );

  // Pushes the array returned by GET /notifications/login-events/, applying
  // the combining rule: away-events that fired together bundle into one
  // banner rather than stacking separately (Section 9).
  const pushLoginEvents = useCallback(
    (events) => {
      const combinable = [];
      for (const event of events) {
        const { type, ...vars } = event;
        if (isSuppressed(type, user)) continue;
        const config = NOTIFICATION_CONFIG[type];
        if (!config) continue;
        const message = resolveMessage(type, vars);
        if (!message) continue;

        const entry = { color: config.color, dismiss: config.dismiss, celebration: config.celebration, message };
        if (COMBINABLE_AWAY_TYPES.has(type)) {
          combinable.push(entry);
        } else {
          addToast([entry]);
        }
      }
      if (combinable.length) addToast(combinable);
    },
    [user, addToast]
  );

  const value = useMemo(
    () => ({ toasts, pushNotification, pushLoginEvents, dismissNotification }),
    [toasts, pushNotification, pushLoginEvents, dismissNotification]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within a NotificationProvider");
  return ctx;
}
