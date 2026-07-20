import { useEffect, useRef } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNotifications } from "./NotificationContext";
import { LIVE_PLACEMENT_DROP_RATE_LIMIT_MS } from "./config";

const POLL_INTERVAL_MS = 20000;

function snapshotFrom(user) {
  return {
    placement: user.placement,
    referredCount: user.referred_count,
    moderationResetAt: user.moderation_reset_at,
  };
}

// Section 9c: the live-check mechanism. No websockets -- just polls
// GET /api/profile/ (via the existing refreshProfile) every ~20s while
// signed in and diffs against the previously-seen snapshot to detect
// placement drops, new confirmed referrals, and moderation resets that
// happened while this tab was open. just_reached_gold/top3 need no diff --
// the backend only returns true on the exact poll where the threshold was
// crossed (see apply_rank_notification_flags).
export default function LiveNotificationWatcher() {
  const { user, refreshProfile } = useAuth();
  const { pushNotification } = useNotifications();
  const snapshotRef = useRef(null);
  const userIdRef = useRef(null);
  const lastPlacementDropAtRef = useRef(0);

  useEffect(() => {
    if (!user) {
      snapshotRef.current = null;
      userIdRef.current = null;
      return;
    }
    if (userIdRef.current !== user.id) {
      userIdRef.current = user.id;
      snapshotRef.current = snapshotFrom(user);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return undefined;

    const interval = setInterval(async () => {
      const fresh = await refreshProfile();
      if (!fresh) return;

      const prev = snapshotRef.current;
      const next = snapshotFrom(fresh);

      if (prev) {
        const droppedPlacement =
          prev.placement != null && (next.placement == null || next.placement > prev.placement);
        if (droppedPlacement) {
          const now = Date.now();
          if (now - lastPlacementDropAtRef.current >= LIVE_PLACEMENT_DROP_RATE_LIMIT_MS) {
            lastPlacementDropAtRef.current = now;
            pushNotification("live_placement_drop", { placement: next.placement });
          }
        }

        if (next.referredCount > prev.referredCount) {
          pushNotification("live_referral_toast");
        }

        if (next.moderationResetAt && next.moderationResetAt !== prev.moderationResetAt) {
          pushNotification("moderation_takedown");
        }
      }

      snapshotRef.current = next;
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user, refreshProfile, pushNotification]);

  useEffect(() => {
    if (!user) return;
    if (user.just_reached_gold) pushNotification("reached_gold_live");
    if (user.just_reached_top3) pushNotification("reached_top3_live");
  }, [user, pushNotification]);

  return null;
}
