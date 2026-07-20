import math

import stripe
from django.conf import settings
from django.db.models import Sum
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User

from .models import Donation
from .selectors import compute_leaderboard
from .serializers import DonateRequestSerializer, LeaderboardEntrySerializer

STRIPE_PERCENT_FEE = 0.029
STRIPE_FLAT_FEE_CENTS = 30


class LeaderboardView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        entries = compute_leaderboard()

        # Includes anonymous donations, unlike the ranked entries above
        # (Section 10b: "Anonymous donations still count toward the total
        # raised / milestone bar").
        total_raised_cents = (
            Donation.objects.aggregate(total=Sum("amount_cents"))["total"] or 0
        )

        return Response(
            {
                "total_raised_cents": total_raised_cents,
                "funding_goal_cents": settings.FUNDING_GOAL_CENTS,
                "donor_count": len(entries),
                "entries": LeaderboardEntrySerializer(
                    entries, many=True, context={"request": request}
                ).data,
            }
        )


def _charge_amount_cents(donation_cents, cover_fee):
    """Section 2a: total = (donation + $0.30) / (1 - 0.029), rounded up so
    the surcharge never slightly under-covers Stripe's actual cut."""
    if not cover_fee:
        return donation_cents
    return math.ceil((donation_cents + STRIPE_FLAT_FEE_CENTS) / (1 - STRIPE_PERCENT_FEE))


class DonateView(APIView):
    """
    Creates a Stripe Checkout Session and hands back its URL for the
    frontend to redirect to. Deliberately does NOT create a Donation row --
    per Section 10c, the database only updates once the Step 7 webhook
    confirms a real charge, so nothing here is treated as "a donation
    happened" yet.
    """

    permission_classes = [AllowAny]

    def post(self, request):
        serializer = DonateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        donation_cents = serializer.validated_data["amount_cents"]
        cover_fee = serializer.validated_data["cover_fee"]
        referral_code = serializer.validated_data.get("referral_code", "")

        if not settings.STRIPE_SECRET_KEY:
            return Response(
                {"detail": "Donations aren't enabled yet — Stripe isn't configured."},
                status=503,
            )

        # A referral link only "activates" once its owner verifies their
        # email (Section 8); an unknown, malformed, or unverified code is
        # treated as if none was given rather than failing the donation.
        client_reference_id = None
        if referral_code.isdigit():
            referrer = User.objects.filter(
                pk=referral_code, email_verified=True
            ).first()
            if referrer:
                client_reference_id = referral_code

        # The credited amount (what counts for leaderboard/points) travels
        # separately from the actual Stripe charge, which may be inflated
        # by the fee-cover surcharge -- the webhook (Step 7) reads this back
        # out so a "cover the fee" donor isn't credited for money Stripe
        # itself took as a processing fee.
        metadata = {"donation_amount_cents": str(donation_cents)}
        if request.user.is_authenticated:
            metadata["donor_user_id"] = str(request.user.id)

        charge_amount_cents = _charge_amount_cents(donation_cents, cover_fee)

        stripe.api_key = settings.STRIPE_SECRET_KEY
        try:
            session = stripe.checkout.Session.create(
                mode="payment",
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "usd",
                            "product_data": {"name": "Formula Zany donation"},
                            "unit_amount": charge_amount_cents,
                        },
                        "quantity": 1,
                    }
                ],
                success_url=(
                    f"{settings.FRONTEND_URL}/donate/success"
                    "?session_id={CHECKOUT_SESSION_ID}"
                ),
                cancel_url=f"{settings.FRONTEND_URL}/donate/cancel",
                client_reference_id=client_reference_id,
                metadata=metadata,
                customer_email=(
                    request.user.email if request.user.is_authenticated else None
                ),
            )
        except stripe.error.StripeError as exc:
            return Response({"detail": str(exc)}, status=502)

        return Response({"checkout_url": session.url})
