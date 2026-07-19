from datetime import timedelta

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import User


class ProfileViewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="profile@example.com",
            password="testpass123",
            full_name="Profile User",
        )
        self.client = APIClient()

    def test_requires_authentication(self):
        resp = self.client.get("/api/profile/")
        self.assertIn(resp.status_code, (401, 403))

    def test_get_returns_profile_with_computed_fields(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get("/api/profile/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["email"], "profile@example.com")
        self.assertEqual(data["points"], 0)
        self.assertEqual(data["tier"], "unranked")
        self.assertIsNone(data["referral_code"])

    def test_referral_code_active_once_verified(self):
        self.user.email_verified = True
        self.user.save()
        self.client.force_authenticate(user=self.user)
        resp = self.client.get("/api/profile/")
        data = resp.json()
        self.assertEqual(data["referral_code"], str(self.user.id))
        self.assertIn(f"?ref={self.user.id}", data["referral_url"])

    def test_patch_display_name_sets_rate_limit_timestamp(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            "/api/profile/", {"display_name": "Newname"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.display_name, "Newname")
        self.assertIsNotNone(self.user.last_name_change)

    def test_patch_display_name_blocked_within_two_weeks(self):
        self.user.display_name = "Original"
        self.user.last_name_change = timezone.now() - timedelta(days=1)
        self.user.save()
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            "/api/profile/", {"display_name": "Changed"}, format="json"
        )
        self.assertEqual(resp.status_code, 400)
        self.user.refresh_from_db()
        self.assertEqual(self.user.display_name, "Original")

    def test_patch_display_name_allowed_within_grace_window(self):
        self.user.display_name = "Original"
        original_time = timezone.now() - timedelta(minutes=5)
        self.user.last_name_change = original_time
        self.user.save()
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            "/api/profile/", {"display_name": "Fixed Typo"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.display_name, "Fixed Typo")
        # Grace-window correction must NOT reset the 2-week clock.
        self.assertEqual(self.user.last_name_change, original_time)

    def test_patch_display_name_allowed_after_two_weeks(self):
        self.user.display_name = "Original"
        self.user.last_name_change = timezone.now() - timedelta(days=15)
        self.user.save()
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            "/api/profile/", {"display_name": "Fresh Name"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)

    def test_disable_all_notifications_forces_live_and_away(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            "/api/profile/", {"disable_all_notifications": True}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.disable_live_notifications)
        self.assertTrue(self.user.disable_away_notifications)

    def test_newsletter_opt_in_updates_freely(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            "/api/profile/", {"newsletter_opt_in": True}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.newsletter_opt_in)

    def test_get_includes_full_name_change_notice(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.get("/api/profile/")
        self.assertIn("90 days", resp.json()["full_name_change_notice"])

    def test_full_name_change_allowed_with_no_confirmation_needed(self):
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            "/api/profile/", {"full_name": "New Real Name"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, "New Real Name")
        self.assertIsNotNone(self.user.last_full_name_change)

    def test_full_name_change_blocked_within_ninety_days(self):
        self.user.last_full_name_change = timezone.now() - timedelta(days=30)
        self.user.save()
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            "/api/profile/", {"full_name": "Another Name"}, format="json"
        )
        self.assertEqual(resp.status_code, 400)
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, "Profile User")

    def test_full_name_change_allowed_within_grace_window(self):
        original_time = timezone.now() - timedelta(minutes=5)
        self.user.last_full_name_change = original_time
        self.user.save()
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            "/api/profile/", {"full_name": "Fixed Typo Name"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertEqual(self.user.full_name, "Fixed Typo Name")
        # Grace-window correction must NOT reset the 90-day clock.
        self.assertEqual(self.user.last_full_name_change, original_time)

    def test_full_name_change_allowed_after_ninety_days(self):
        self.user.last_full_name_change = timezone.now() - timedelta(days=91)
        self.user.save()
        self.client.force_authenticate(user=self.user)
        resp = self.client.patch(
            "/api/profile/", {"full_name": "Fresh Real Name"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
