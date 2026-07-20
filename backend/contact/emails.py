"""
Section 5b: the Footer's "Contact us" is a real on-site form, submissions
emailed to the Operator via Brevo -- not a plain mailto: link. Same
graceful-degrade stub as accounts/emails.py: no Brevo/Resend account exists
yet, so this just logs the submission for now.
"""

import logging

logger = logging.getLogger(__name__)


def send_contact_email(name, email, message):
    # TODO: wire up Brevo (primary) / Resend (fallback) once API keys exist
    # (Section 6a describes the same provider pairing for account emails).
    logger.info(
        "Contact form submission not emailed (no email provider configured yet): "
        "name=%r email=%r message=%r",
        name,
        email,
        message,
    )
