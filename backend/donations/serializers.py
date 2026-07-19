from rest_framework import serializers


class LeaderboardEntrySerializer(serializers.Serializer):
    """Serializes donations.selectors.LeaderboardEntry (a dataclass, not a model)."""

    user_id = serializers.IntegerField(source="user.id")
    name = serializers.SerializerMethodField()
    profile_picture_url = serializers.CharField(
        source="user.profile_picture_url", allow_null=True
    )
    tier = serializers.CharField()
    placement = serializers.IntegerField(allow_null=True)
    ahead_count = serializers.IntegerField(allow_null=True)
    percentile = serializers.IntegerField(allow_null=True)
    points = serializers.IntegerField()
    total_donated_cents = serializers.IntegerField()
    referred_count = serializers.IntegerField()
    on_car = serializers.BooleanField()
    sponsor_tier = serializers.BooleanField()
    amount_to_bronze_cents = serializers.IntegerField()
    is_self = serializers.SerializerMethodField()

    def get_name(self, obj):
        return obj.user.public_name()

    def get_is_self(self, obj):
        request = self.context.get("request")
        return bool(
            request
            and request.user.is_authenticated
            and request.user.id == obj.user.id
        )


class DonateRequestSerializer(serializers.Serializer):
    amount_cents = serializers.IntegerField(min_value=100)  # $1 minimum (Section 2a)
    cover_fee = serializers.BooleanField(default=False)
    referral_code = serializers.CharField(required=False, allow_blank=True)
