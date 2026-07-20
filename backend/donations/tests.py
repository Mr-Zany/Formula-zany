from collections import Counter
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from accounts.models import User
from donations.models import Donation, Referral
from donations.selectors import compute_leaderboard


class LeaderboardSelectorTests(TestCase):
    def test_referral_only_user_outranks_smaller_direct_donor(self):
        referrer = User.objects.create_user(
            email="referrer@example.com", password="x", full_name="Referrer"
        )
        donor = User.objects.create_user(
            email="donor@example.com", password="x", full_name="Donor"
        )
        small_donor = User.objects.create_user(
            email="small@example.com", password="x", full_name="Small Donor"
        )

        donation = Donation.objects.create(
            user=donor, amount_cents=100, stripe_payment_id="pi_1"
        )
        Referral.objects.create(referrer=referrer, referred_donation=donation)
        Donation.objects.create(
            user=small_donor, amount_cents=150, stripe_payment_id="pi_2"
        )

        entries = {e.user.email: e for e in compute_leaderboard()}
        self.assertEqual(entries["referrer@example.com"].points, 5)
        self.assertEqual(entries["small@example.com"].points, 3)
        self.assertLess(
            entries["referrer@example.com"].placement,
            entries["small@example.com"].placement,
        )

    def test_bronze_floor_not_backfilled(self):
        top_users = [
            User(email=f"top{i}@example.com", full_name=f"Top {i}") for i in range(100)
        ]
        for u in top_users:
            u.set_unusable_password()
        User.objects.bulk_create(top_users)
        top_users = list(User.objects.filter(email__startswith="top").order_by("id"))
        Donation.objects.bulk_create(
            [
                Donation(
                    user=u,
                    amount_cents=(1000 - i) * 100,
                    stripe_payment_id=f"pi_top_{i}",
                )
                for i, u in enumerate(top_users)
            ]
        )

        # 10 users competing for ranks 101-110 (the fixed Bronze window):
        # 5 clear the $20 floor, 5 don't -- both well below the top 100.
        low_users = [
            User(email=f"low{i}@example.com", full_name=f"Low {i}") for i in range(10)
        ]
        for u in low_users:
            u.set_unusable_password()
        User.objects.bulk_create(low_users)
        low_users = list(User.objects.filter(email__startswith="low").order_by("id"))
        Donation.objects.bulk_create(
            [
                Donation(
                    user=u,
                    amount_cents=2500 if i < 5 else 1500,
                    stripe_payment_id=f"pi_low_{i}",
                )
                for i, u in enumerate(low_users)
            ]
        )

        entries = {e.user.email: e for e in compute_leaderboard()}
        for i in range(5):
            self.assertEqual(entries[f"low{i}@example.com"].tier, "bronze")
        for i in range(5, 10):
            self.assertEqual(entries[f"low{i}@example.com"].tier, "unranked")

        bronze_members = [e for e in entries.values() if e.tier == "bronze"]
        self.assertEqual(len(bronze_members), 5)
        self.assertEqual(sorted(e.placement for e in bronze_members), [1, 2, 3, 4, 5])

    def test_fixed_slot_percentage_handoff_at_200(self):
        users = [User(email=f"u{i}@example.com", full_name=f"U {i}") for i in range(200)]
        for u in users:
            u.set_unusable_password()
        User.objects.bulk_create(users)
        users = list(User.objects.filter(email__startswith="u").order_by("id"))
        Donation.objects.bulk_create(
            [
                Donation(
                    user=u,
                    amount_cents=(200 - i) * 100 + 5000,
                    stripe_payment_id=f"pi_u_{i}",
                )
                for i, u in enumerate(users)
            ]
        )
        entries = compute_leaderboard()
        counts = Counter(e.tier for e in entries)
        self.assertEqual(counts["gold"], 20)
        self.assertEqual(counts["silver"], 80)
        self.assertEqual(counts["bronze"], 80)


class LeaderboardViewTests(TestCase):
    def test_leaderboard_totals_include_anonymous_donations(self):
        user = User.objects.create_user(
            email="donor@example.com", password="x", full_name="Donor"
        )
        Donation.objects.create(user=user, amount_cents=5000, stripe_payment_id="pi_1")
        Donation.objects.create(
            amount_cents=1000, stripe_payment_id="pi_anon", guest_email="g@example.com"
        )

        client = APIClient()
        resp = client.get("/api/leaderboard/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["total_raised_cents"], 6000)
        self.assertEqual(data["donor_count"], 1)
        self.assertEqual(len(data["entries"]), 1)
        self.assertEqual(data["entries"][0]["name"], "Donor")


class DonateViewTests(TestCase):
    def test_rejects_below_minimum(self):
        client = APIClient()
        resp = client.post("/api/donate/", {"amount_cents": 50}, format="json")
        self.assertEqual(resp.status_code, 400)

    @override_settings(STRIPE_SECRET_KEY="")
    def test_returns_503_when_stripe_not_configured(self):
        client = APIClient()
        resp = client.post("/api/donate/", {"amount_cents": 500}, format="json")
        self.assertEqual(resp.status_code, 503)

    @override_settings(STRIPE_SECRET_KEY="sk_test_fake")
    @patch("donations.views.stripe.checkout.Session.create")
    def test_creates_checkout_session_and_passes_referral_and_metadata(self, mock_create):
        mock_create.return_value = MagicMock(url="https://checkout.stripe.com/fake")
        referrer = User.objects.create_user(
            email="referrer@example.com",
            password="x",
            full_name="Referrer",
            email_verified=True,
        )
        client = APIClient()
        resp = client.post(
            "/api/donate/",
            {"amount_cents": 500, "referral_code": str(referrer.id)},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["checkout_url"], "https://checkout.stripe.com/fake")
        _, kwargs = mock_create.call_args
        self.assertEqual(kwargs["client_reference_id"], str(referrer.id))
        self.assertEqual(kwargs["metadata"]["donation_amount_cents"], "500")
        self.assertNotIn("donor_user_id", kwargs["metadata"])

    @override_settings(STRIPE_SECRET_KEY="sk_test_fake")
    @patch("donations.views.stripe.checkout.Session.create")
    def test_ignores_unverified_referral_code(self, mock_create):
        mock_create.return_value = MagicMock(url="https://checkout.stripe.com/fake")
        unverified = User.objects.create_user(
            email="unverified@example.com", password="x", full_name="Unverified"
        )
        client = APIClient()
        resp = client.post(
            "/api/donate/",
            {"amount_cents": 500, "referral_code": str(unverified.id)},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        _, kwargs = mock_create.call_args
        self.assertIsNone(kwargs["client_reference_id"])

    @override_settings(STRIPE_SECRET_KEY="sk_test_fake")
    @patch("donations.views.stripe.checkout.Session.create")
    def test_cover_fee_inflates_charge_but_not_credited_amount(self, mock_create):
        mock_create.return_value = MagicMock(url="https://checkout.stripe.com/fake")
        client = APIClient()
        resp = client.post(
            "/api/donate/", {"amount_cents": 2000, "cover_fee": True}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        _, kwargs = mock_create.call_args
        line_item = kwargs["line_items"][0]
        self.assertGreater(line_item["price_data"]["unit_amount"], 2000)
        self.assertEqual(kwargs["metadata"]["donation_amount_cents"], "2000")

    @override_settings(STRIPE_SECRET_KEY="sk_test_fake")
    @patch("donations.views.stripe.checkout.Session.create")
    def test_authenticated_donor_id_travels_in_metadata(self, mock_create):
        mock_create.return_value = MagicMock(url="https://checkout.stripe.com/fake")
        user = User.objects.create_user(
            email="signedin@example.com", password="x", full_name="Signed In"
        )
        client = APIClient()
        client.force_authenticate(user=user)
        resp = client.post("/api/donate/", {"amount_cents": 500}, format="json")
        self.assertEqual(resp.status_code, 200)
        _, kwargs = mock_create.call_args
        self.assertEqual(kwargs["metadata"]["donor_user_id"], str(user.id))
