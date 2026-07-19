from django.conf import settings
from django.utils import timezone
from rest_framework import serializers

from donations.selectors import compute_leaderboard

from .models import Rank, User

NAME_PICTURE_CHANGE_COOLDOWN = timezone.timedelta(days=14)
FULL_NAME_CHANGE_COOLDOWN = timezone.timedelta(days=90)
CHANGE_GRACE_WINDOW = timezone.timedelta(minutes=20)


def check_rate_limit(last_change_at, now, cooldown=NAME_PICTURE_CHANGE_COOLDOWN):
    """
    Returns (allowed, effective_last_change_at, error_message) for a
    change-cooldown field with a 20-minute typo-correction grace window
    (Section 7b; the full-name cooldown reuses the same mechanic on top of
    that section). The cooldown clock always counts from the *original*
    change time -- a correction inside the grace window does not reset it,
    so the grace window can't be chained to stall the lock indefinitely.
    """
    if last_change_at is None:
        return True, now, None
    elapsed = now - last_change_at
    if elapsed <= CHANGE_GRACE_WINDOW:
        return True, last_change_at, None
    if elapsed < cooldown:
        next_allowed = last_change_at + cooldown
        return (
            False,
            last_change_at,
            f"You can change this again on {next_allowed.date().isoformat()}.",
        )
    return True, now, None


class ProfileSerializer(serializers.ModelSerializer):
    referral_code = serializers.SerializerMethodField()
    referral_url = serializers.SerializerMethodField()
    points = serializers.SerializerMethodField()
    tier = serializers.SerializerMethodField()
    placement = serializers.SerializerMethodField()
    referred_count = serializers.SerializerMethodField()
    on_car = serializers.SerializerMethodField()
    sponsor_tier = serializers.SerializerMethodField()

    # Write-only, not persisted -- must be explicitly true whenever full_name
    # actually changes (see validate() below). Mirrors the ToS-checkbox gate
    # already used for anonymous donations (Section 2): a real name change
    # is consequential enough to require an explicit acknowledgment, not
    # just a passive warning a frontend could forget to show.
    confirm_full_name_change = serializers.BooleanField(
        write_only=True, required=False, default=False
    )

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "full_name",
            "display_name",
            "name_display_pref",
            "profile_picture_url",
            "email_verified",
            "newsletter_opt_in",
            "disable_live_notifications",
            "disable_away_notifications",
            "disable_all_notifications",
            "last_name_change",
            "last_picture_change",
            "last_full_name_change",
            "confirm_full_name_change",
            "referral_code",
            "referral_url",
            "points",
            "tier",
            "placement",
            "referred_count",
            "on_car",
            "sponsor_tier",
        ]
        # id/email/email_verified stay fixed here: account identity fields
        # not exposed anywhere in the Profile Settings panel (Section 7).
        # full_name and newsletter_opt_in ARE writable -- full_name through
        # its own rate-limited, confirmation-gated path below; newsletter
        # opt-out also still works via the email's own unsubscribe link
        # (CAN-SPAM), this is just an additional in-app path for it.
        read_only_fields = [
            "id",
            "email",
            "email_verified",
            "last_name_change",
            "last_picture_change",
            "last_full_name_change",
        ]

    def _leaderboard_entry(self, user):
        if not hasattr(self, "_entry_cache"):
            self._entry_cache = {entry.user.id: entry for entry in compute_leaderboard()}
        return self._entry_cache.get(user.id)

    def get_points(self, obj):
        entry = self._leaderboard_entry(obj)
        return entry.points if entry else 0

    def get_tier(self, obj):
        entry = self._leaderboard_entry(obj)
        return entry.tier if entry else Rank.UNRANKED

    def get_placement(self, obj):
        entry = self._leaderboard_entry(obj)
        return entry.placement if entry else None

    def get_referred_count(self, obj):
        entry = self._leaderboard_entry(obj)
        return entry.referred_count if entry else 0

    def get_on_car(self, obj):
        entry = self._leaderboard_entry(obj)
        return entry.on_car if entry else False

    def get_sponsor_tier(self, obj):
        entry = self._leaderboard_entry(obj)
        return entry.sponsor_tier if entry else False

    def get_referral_code(self, obj):
        # Referral link only activates once email is verified (Section 8).
        if not obj.email_verified:
            return None
        return str(obj.id)

    def get_referral_url(self, obj):
        if not obj.email_verified:
            return None
        return f"{settings.FRONTEND_URL}/?ref={obj.id}"

    def validate_full_name(self, value):
        user = self.instance
        if value == user.full_name:
            return value
        allowed, _, error = check_rate_limit(
            user.last_full_name_change, timezone.now(), cooldown=FULL_NAME_CHANGE_COOLDOWN
        )
        if not allowed:
            raise serializers.ValidationError(error)
        return value

    def validate(self, attrs):
        if "full_name" in attrs and attrs["full_name"] != self.instance.full_name:
            if not attrs.get("confirm_full_name_change"):
                raise serializers.ValidationError(
                    {
                        "confirm_full_name_change": (
                            "Changing your full name requires confirmation: it must "
                            "be your real name per our Terms of Service, and you "
                            "won't be able to change it again for 90 days. Set "
                            "confirm_full_name_change=true to proceed."
                        )
                    }
                )
        return attrs

    def validate_display_name(self, value):
        user = self.instance
        if value == user.display_name:
            return value
        allowed, _, error = check_rate_limit(user.last_name_change, timezone.now())
        if not allowed:
            raise serializers.ValidationError(error)
        return value

    def validate_profile_picture_url(self, value):
        user = self.instance
        if value == user.profile_picture_url:
            return value
        allowed, _, error = check_rate_limit(user.last_picture_change, timezone.now())
        if not allowed:
            raise serializers.ValidationError(error)
        return value

    def update(self, instance, validated_data):
        now = timezone.now()
        validated_data.pop("confirm_full_name_change", None)

        if (
            "display_name" in validated_data
            and validated_data["display_name"] != instance.display_name
        ):
            _, instance.last_name_change, _ = check_rate_limit(
                instance.last_name_change, now
            )

        if (
            "profile_picture_url" in validated_data
            and validated_data["profile_picture_url"] != instance.profile_picture_url
        ):
            _, instance.last_picture_change, _ = check_rate_limit(
                instance.last_picture_change, now
            )

        if (
            "full_name" in validated_data
            and validated_data["full_name"] != instance.full_name
        ):
            _, instance.last_full_name_change, _ = check_rate_limit(
                instance.last_full_name_change, now, cooldown=FULL_NAME_CHANGE_COOLDOWN
            )

        for field, value in validated_data.items():
            setattr(instance, field, value)

        # Cascading toggle (Section 7a): disabling "all" forces live+away on
        # too, so they can't be independently unchecked while "all" is set.
        if instance.disable_all_notifications:
            instance.disable_live_notifications = True
            instance.disable_away_notifications = True

        instance.save()
        return instance
