"""
Account-related email verification.

Uses django.core.signing for the verification token -- the same signed,
single-use-token pattern the PRD specifies for password reset (Section 6b:
"the same pattern as email verification in Section 6a"), rather than a
plain link with the email/id embedded in the clear.

Actually sending the email (Brevo primary, Resend fallback per Section 6a)
isn't wired up yet -- there's no provider account or SDK integration in
this codebase. send_verification_email() is a thin, swappable seam: it
logs the link for now so registration works end-to-end in dev, and is the
one place a real provider call gets added later.
"""

import logging

from django.conf import settings
from django.core import signing

logger = logging.getLogger(__name__)

VERIFICATION_SALT = "accounts.email-verification"


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
