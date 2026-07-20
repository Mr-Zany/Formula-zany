"""
Account-related emails: sign-up verification and password reset.

Both use django.core.signing for their tokens -- signed, single-use tokens
rather than a plain link with the email/id embedded in the clear (Section
6b explicitly specifies this pattern for password reset, "the same pattern
as email verification in Section 6a").

Actually sending mail (Brevo primary, Resend fallback per Section 6a)
isn't wired up yet -- there's no provider account or SDK integration in
this codebase. The send_*_email() functions are thin, swappable seams:
they log the link for now so both flows are testable end-to-end in dev,
and are the one place a real provider call gets added later.
"""

import logging

from django.conf import settings
from django.core import signing

logger = logging.getLogger(__name__)

VERIFICATION_SALT = "accounts.email-verification"
RESET_SALT = "accounts.password-reset"
RESET_MAX_AGE_SECONDS = 60 * 60  # 1 hour (Section 6b)


def generate_verification_token(user):
    return signing.dumps({"user_id": user.id}, salt=VERIFICATION_SALT)


def read_verification_token(token):
    """Returns the user id encoded in the token, or None if it's invalid."""
    try:
        data = signing.loads(token, salt=VERIFICATION_SALT)
    except signing.BadSignature:
        return None
    return data.get("user_id")


def build_verification_url(token):
    return f"{settings.FRONTEND_URL}/verify-email?token={token}"


def send_verification_email(user, verification_url):
    # TODO: wire up Brevo (primary) / Resend (fallback) once API keys exist
    # (Section 6a). Until then, log the link so the flow is testable.
    logger.info(
        "Verification email for %s not sent (no email provider configured yet); link: %s",
        user.email,
        verification_url,
    )


def generate_reset_token(user):
    # Embedding a slice of the *current* password hash means a successful
    # reset (which changes the hash) silently invalidates every other
    # outstanding token for this account (Section 6b), with no extra DB
    # field or server-side revocation list needed. Must be a *suffix* --
    # Django's hash format is "<hasher>$<iterations>$<salt>$<digest>", and
    # the hasher/iteration prefix is identical for every user, so a prefix
    # slice would carry no actual entropy from the password itself.
    return signing.dumps(
        {"user_id": user.id, "pw": user.password[-12:]}, salt=RESET_SALT
    )


def read_reset_token(token):
    """
    Returns (user_id, pw_fingerprint, error) -- error is None, "expired",
    or "invalid". The caller must still compare pw_fingerprint against the
    target user's *current* password[-12:] -- this function only decodes
    the token, it has no DB access to check the fingerprint itself.
    """
    try:
        data = signing.loads(token, salt=RESET_SALT, max_age=RESET_MAX_AGE_SECONDS)
    except signing.SignatureExpired:
        return None, None, "expired"
    except signing.BadSignature:
        return None, None, "invalid"
    return data.get("user_id"), data.get("pw"), None


def build_reset_url(token):
    return f"{settings.FRONTEND_URL}/reset-password?token={token}"


def send_password_reset_email(user, reset_url):
    # Same stub as send_verification_email -- no real provider wired up yet.
    logger.info(
        "Password reset email for %s not sent (no email provider configured yet); link: %s",
        user.email,
        reset_url,
    )
