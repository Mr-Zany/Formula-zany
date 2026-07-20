from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import Rank
from donations.models import Referral
from donations.selectors import (
    RANK_ORDER,
    apply_rank_notification_flags,
    compute_leaderboard,
    get_entry_for_user,
)


class LoginEventsView(APIView):
    """
    Section 9b: the once-per-login check. Called by the frontend immediately
    after a successful login/registration. Owns reading and updating
    last_login/last_seen_rank for this purpose -- SIMPLE_JWT's own
    UPDATE_LAST_LOGIN stays off, so there's no race between the separate
    token endpoint and this one over who writes last_login first.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        previous_last_login = user.last_login
        is_first_login = previous_last_login is None

        entries = compute_leaderboard()
        entry = get_entry_for_user(user, entries)
        current_tier = entry.tier if entry else Rank.UNRANKED

        events = []

        if is_first_login:
            events.append({"type": "account_created"})
        else:
            events.append({"type": "sign_in"})

            previous_tier = user.last_seen_rank
            if previous_tier and RANK_ORDER.get(current_tier, 3) > RANK_ORDER.get(
                previous_tier, 3
            ):
                events.append(
                    {
                        "type": "rank_dropped_away",
                        "old_tier": previous_tier,
                        "new_tier": current_tier,
                    }
                )

            referral_count = Referral.objects.filter(
                referrer=user, referred_donation__timestamp__gt=previous_last_login
            ).count()
            if referral_count > 0:
                events.append({"type": "referral_catchup", "count": referral_count})

            if user.moderation_reset_at and user.moderation_reset_at > previous_last_login:
                events.append({"type": "moderation_takedown"})

        just_reached_gold, just_reached_top3 = apply_rank_notification_flags(user, entry)
        if just_reached_gold:
            events.append({"type": "reached_gold_away"})
        if just_reached_top3:
            events.append({"type": "reached_top3_away"})

        user.last_seen_rank = current_tier
        user.last_login = timezone.now()
        user.save(update_fields=["last_seen_rank", "last_login"])

        return Response({"events": events})
