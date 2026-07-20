from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import Rank, User
from donations.models import Donation, Referral


def _events_by_type(events):
    return {e["type"]: e for e in events}


class LoginEventsViewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="u@example.com", password="x", full_name="U", email_verified=True
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_first_login_returns_account_created(self):
        resp = self.client.get("/api/notifications/login-events/")
        self.assertEqual(resp.status_code, 200)
        events = _events_by_type(resp.json()["events"])
        self.assertIn("account_created", events)
        self.assertNotIn("sign_in", events)

    def test_second_login_returns_sign_in_not_account_created(self):
        self.client.get("/api/notifications/login-events/")
        resp = self.client.get("/api/notifications/login-events/")
        events = _events_by_type(resp.json()["events"])
        self.assertIn("sign_in", events)
        self.assertNotIn("account_created", events)

    def test_rank_drop_fires_when_tier_actually_changes(self):
        # First login establishes a baseline (Unranked, no donations yet).
        self.client.get("/api/notifications/login-events/")
        self.user.last_seen_rank = Rank.SILVER
        self.user.save(update_fields=["last_seen_rank"])

        # Still Unranked (no donations) -> Silver to Unranked is a drop.
        resp = self.client.get("/api/notifications/login-events/")
        events = _events_by_type(resp.json()["events"])
        self.assertIn("rank_dropped_away", events)
        self.assertEqual(events["rank_dropped_away"]["old_tier"], Rank.SILVER)
        self.assertEqual(events["rank_dropped_away"]["new_tier"], Rank.UNRANKED)

    def test_no_rank_drop_event_when_tier_unchanged(self):
        self.client.get("/api/notifications/login-events/")
        resp = self.client.get("/api/notifications/login-events/")
        events = _events_by_type(resp.json()["events"])
        self.assertNotIn("rank_dropped_away", events)

    def test_referral_catchup_counts_only_referrals_after_previous_login(self):
        self.client.get("/api/notifications/login-events/")
        before_second_login = timezone.now()
        self.user.refresh_from_db()
        self.assertIsNotNone(self.user.last_login)

        donor = User.objects.create_user(email="d@example.com", password="x", full_name="D")
        old_donation = Donation.objects.create(
            user=donor, amount_cents=500, stripe_payment_id="pi_old"
        )
        Referral.objects.create(referrer=self.user, referred_donation=old_donation)
        old_donation.timestamp = self.user.last_login - timezone.timedelta(days=1)
        old_donation.save(update_fields=["timestamp"])

        new_donation = Donation.objects.create(
            user=donor, amount_cents=500, stripe_payment_id="pi_new"
        )
        Referral.objects.create(referrer=self.user, referred_donation=new_donation)

        resp = self.client.get("/api/notifications/login-events/")
        events = _events_by_type(resp.json()["events"])
        self.assertIn("referral_catchup", events)
        self.assertEqual(events["referral_catchup"]["count"], 1)

    def test_reached_gold_away_fires_once_and_resets_on_exit(self):
        for i in range(25):
            u = User.objects.create_user(email=f"gold{i}@example.com", password="x", full_name=f"G{i}")
            Donation.objects.create(user=u, amount_cents=100000 - i, stripe_payment_id=f"pi_gold_{i}")
        Donation.objects.create(user=self.user, amount_cents=99999999, stripe_payment_id="pi_self_gold")

        resp = self.client.get("/api/notifications/login-events/")
        events = _events_by_type(resp.json()["events"])
        self.assertIn("reached_gold_away", events)

        # Doesn't refire on the very next login while still in Gold.
        resp = self.client.get("/api/notifications/login-events/")
        events = _events_by_type(resp.json()["events"])
        self.assertNotIn("reached_gold_away", events)

        self.user.refresh_from_db()
        self.assertTrue(self.user.notified_gold)

    def test_moderation_takedown_fires_only_when_reset_happened_while_away(self):
        self.client.get("/api/notifications/login-events/")
        self.user.refresh_from_db()

        self.user.moderation_reset_at = self.user.last_login - timezone.timedelta(days=1)
        self.user.save(update_fields=["moderation_reset_at"])
        resp = self.client.get("/api/notifications/login-events/")
        events = _events_by_type(resp.json()["events"])
        self.assertNotIn("moderation_takedown", events)

        self.user.moderation_reset_at = timezone.now()
        self.user.save(update_fields=["moderation_reset_at"])
        resp = self.client.get("/api/notifications/login-events/")
        events = _events_by_type(resp.json()["events"])
        self.assertIn("moderation_takedown", events)

    def test_requires_authentication(self):
        client = APIClient()
        resp = client.get("/api/notifications/login-events/")
        self.assertIn(resp.status_code, (401, 403))
