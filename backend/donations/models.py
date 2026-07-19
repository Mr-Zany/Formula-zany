from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

# $1 minimum donation (PRD Section 2a), enforced at Stripe Checkout — this
# validator is a second check wherever model validation runs (serializers, admin).
MINIMUM_DONATION_CENTS = 100


class Donation(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="donations",
    )
    amount_cents = models.PositiveIntegerField(
        validators=[MinValueValidator(MINIMUM_DONATION_CENTS)]
    )
    timestamp = models.DateTimeField(auto_now_add=True)
    stripe_payment_id = models.CharField(max_length=255, unique=True)

    # Not applicable when user is null — anonymous donations never appear on
    # the leaderboard regardless (PRD Section 10b).
    display_consent = models.BooleanField(default=True)

    guest_email = models.EmailField(null=True, blank=True)

    def __str__(self):
        return f"{self.amount_cents / 100:.2f} ({self.stripe_payment_id})"


class Referral(models.Model):
    referrer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="referrals",
    )
    referred_donation = models.OneToOneField(
        Donation,
        on_delete=models.CASCADE,
        related_name="referral",
    )

    def __str__(self):
        return f"{self.referrer} <- {self.referred_donation}"
