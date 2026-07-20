from django.contrib import admin

from .models import Donation, Referral


class ReferralInline(admin.StackedInline):
    model = Referral
    fk_name = "referred_donation"
    extra = 0


@admin.register(Donation)
class DonationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "amount_display",
        "user",
        "guest_email",
        "stripe_payment_id",
        "timestamp",
    )
    list_filter = ("timestamp",)
    search_fields = (
        "stripe_payment_id",
        "guest_email",
        "user__email",
        "user__full_name",
    )
    readonly_fields = ("timestamp",)
    inlines = [ReferralInline]

    @admin.display(description="Amount")
    def amount_display(self, obj):
        return f"${obj.amount_cents / 100:.2f}"


@admin.register(Referral)
class ReferralAdmin(admin.ModelAdmin):
    list_display = ("id", "referrer", "referred_donation")
    search_fields = ("referrer__email", "referred_donation__stripe_payment_id")
