import time
from datetime import timedelta
from unittest.mock import patch

from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.emails import generate_reset_token, generate_verification_token
from accounts.models import User


class ProfileViewTests(TestCase):
    def setUp(self):
        # Verified by default: most of this class tests PATCH mechanics,
        # which Section 6a locks behind email verification. The unverified
        # case gets its own dedicated tests below.
        self.user = User.objects.create_user(
            email="profile@example.com",
            password="testpass123",
            full_name="Profile User",
            email_verified=True,
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
        self.assertEqual(data["referral_code"], str(self.user.id))

    def test_referral_code_none_when_not_verified(self):
        unverified = User.objects.create_user(
            email="unverified-referral@example.com",
            password="x",
            full_name="Unverified",
        )
        self.client.force_authenticate(user=unverified)
        resp = self.client.get("/api/profile/")
        data = resp.json()
        self.assertIsNone(data["referral_code"])
        self.assertIsNone(data["referral_url"])

    def test_patch_blocked_when_not_verified(self):
        unverified = User.objects.create_user(
            email="unverified-patch@example.com", password="x", full_name="Unverified"
        )
        self.client.force_authenticate(user=unverified)
        resp = self.client.patch(
            "/api/profile/", {"display_name": "Nope"}, format="json"
        )
        self.assertEqual(resp.status_code, 403)

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


VALID_REGISTRATION = {
    "email": "newuser@example.com",
    "password": "a-genuinely-strong-passphrase-42",
    "full_name": "New User",
    "tos_accepted": True,
    "age_confirmed": True,
}


class RegisterViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @override_settings(DEBUG=True)
    def test_register_creates_unverified_account_and_exposes_link_in_debug(self):
        resp = self.client.post(
            "/api/auth/register/", VALID_REGISTRATION, format="json"
        )
        self.assertEqual(resp.status_code, 201)
        user = User.objects.get(email="newuser@example.com")
        self.assertFalse(user.email_verified)
        self.assertIsNotNone(user.tos_accepted_at)
        self.assertIsNotNone(user.age_confirmed_at)
        self.assertTrue(user.check_password(VALID_REGISTRATION["password"]))
        self.assertIn("verification_url", resp.json())

    @override_settings(DEBUG=False)
    def test_verification_url_not_exposed_outside_debug(self):
        resp = self.client.post(
            "/api/auth/register/", VALID_REGISTRATION, format="json"
        )
        self.assertEqual(resp.status_code, 201)
        self.assertNotIn("verification_url", resp.json())

    def test_register_requires_tos_acceptance(self):
        payload = {**VALID_REGISTRATION, "tos_accepted": False}
        resp = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("tos_accepted", resp.json())

    def test_register_requires_age_confirmation(self):
        payload = {**VALID_REGISTRATION, "age_confirmed": False}
        resp = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("age_confirmed", resp.json())

    def test_register_rejects_weak_password(self):
        payload = {**VALID_REGISTRATION, "password": "password"}
        resp = self.client.post("/api/auth/register/", payload, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("password", resp.json())

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(
            email="newuser@example.com", password="x", full_name="Existing"
        )
        resp = self.client.post(
            "/api/auth/register/", VALID_REGISTRATION, format="json"
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("email", resp.json())


class VerifyEmailViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="verifyme@example.com", password="x", full_name="Verify Me"
        )

    def test_valid_token_verifies_account(self):
        token = generate_verification_token(self.user)
        resp = self.client.post(
            "/api/auth/verify-email/", {"token": token}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.email_verified)

    def test_garbage_token_rejected(self):
        resp = self.client.post(
            "/api/auth/verify-email/", {"token": "not-a-real-token"}, format="json"
        )
        self.assertEqual(resp.status_code, 400)
        self.user.refresh_from_db()
        self.assertFalse(self.user.email_verified)

    def test_missing_token_rejected(self):
        resp = self.client.post("/api/auth/verify-email/", {}, format="json")
        self.assertEqual(resp.status_code, 400)


class JWTAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="jwt@example.com",
            password="testpass123",
            full_name="JWT User",
            email_verified=True,
        )

    def test_login_with_email_and_password_returns_tokens(self):
        resp = self.client.post(
            "/api/auth/token/",
            {"email": "jwt@example.com", "password": "testpass123"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access", data)
        self.assertIn("refresh", data)

    def test_login_with_wrong_password_rejected(self):
        resp = self.client.post(
            "/api/auth/token/",
            {"email": "jwt@example.com", "password": "wrong"},
            format="json",
        )
        self.assertEqual(resp.status_code, 401)

    def test_refresh_returns_new_access_token(self):
        login_resp = self.client.post(
            "/api/auth/token/",
            {"email": "jwt@example.com", "password": "testpass123"},
            format="json",
        )
        refresh_token = login_resp.json()["refresh"]
        resp = self.client.post(
            "/api/auth/token/refresh/", {"refresh": refresh_token}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("access", resp.json())

    def test_access_token_authenticates_profile_request(self):
        login_resp = self.client.post(
            "/api/auth/token/",
            {"email": "jwt@example.com", "password": "testpass123"},
            format="json",
        )
        access_token = login_resp.json()["access"]
        resp = self.client.get(
            "/api/profile/", HTTP_AUTHORIZATION=f"Bearer {access_token}"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["email"], "jwt@example.com")


class PasswordResetTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="resetme@example.com", password="OldPassword123!", full_name="Reset Me"
        )

    @override_settings(DEBUG=True)
    def test_request_with_known_email_returns_reset_url_in_debug(self):
        resp = self.client.post(
            "/api/auth/password-reset/", {"email": "resetme@example.com"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("reset_url", resp.json())

    @override_settings(DEBUG=True)
    def test_request_with_unknown_email_gives_same_generic_response_no_url(self):
        resp = self.client.post(
            "/api/auth/password-reset/", {"email": "nobody@example.com"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertNotIn("reset_url", resp.json())

    @override_settings(DEBUG=False)
    def test_reset_url_not_exposed_outside_debug(self):
        resp = self.client.post(
            "/api/auth/password-reset/", {"email": "resetme@example.com"}, format="json"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertNotIn("reset_url", resp.json())

    def test_confirm_with_valid_token_sets_new_password(self):
        token = generate_reset_token(self.user)
        resp = self.client.post(
            "/api/auth/password-reset/confirm/",
            {"token": token, "new_password": "a-genuinely-strong-passphrase-99"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("a-genuinely-strong-passphrase-99"))

    def test_confirm_rejects_weak_password(self):
        token = generate_reset_token(self.user)
        resp = self.client.post(
            "/api/auth/password-reset/confirm/",
            {"token": token, "new_password": "password"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("OldPassword123!"))

    def test_confirm_rejects_garbage_token(self):
        resp = self.client.post(
            "/api/auth/password-reset/confirm/",
            {"token": "not-a-real-token", "new_password": "a-genuinely-strong-passphrase-99"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_confirm_rejects_expired_token(self):
        with patch("django.core.signing.time.time", return_value=time.time() - 7200):
            token = generate_reset_token(self.user)
        resp = self.client.post(
            "/api/auth/password-reset/confirm/",
            {"token": token, "new_password": "a-genuinely-strong-passphrase-99"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("expired", resp.json()["detail"])

    def test_reusing_token_after_successful_reset_fails(self):
        token = generate_reset_token(self.user)
        first = self.client.post(
            "/api/auth/password-reset/confirm/",
            {"token": token, "new_password": "a-genuinely-strong-passphrase-99"},
            format="json",
        )
        self.assertEqual(first.status_code, 200)

        second = self.client.post(
            "/api/auth/password-reset/confirm/",
            {"token": token, "new_password": "yet-another-strong-passphrase-11"},
            format="json",
        )
        self.assertEqual(second.status_code, 400)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("a-genuinely-strong-passphrase-99"))
