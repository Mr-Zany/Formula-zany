from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("email_verified", True)

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")

        return self._create_user(email, password, **extra_fields)


class Rank(models.TextChoices):
    """The tier — see PRD Terminology: Rank = tier, distinct from Placement (numeric position)."""

    GOLD = "gold", "Gold"
    SILVER = "silver", "Silver"
    BRONZE = "bronze", "Bronze"
    UNRANKED = "unranked", "Unranked"


class NameDisplayPref(models.TextChoices):
    FULL_NAME = "full_name", "Full name"
    DISPLAY_NAME = "display_name", "Display name"


class User(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)

    full_name = models.CharField(max_length=150)
    display_name = models.CharField(max_length=150, blank=True)
    profile_picture_url = models.URLField(blank=True, null=True)
    name_display_pref = models.CharField(
        max_length=20,
        choices=NameDisplayPref.choices,
        default=NameDisplayPref.FULL_NAME,
    )

    # Original-change timestamps for the display-name/photo/full-name change
    # cooldowns (PRD 7b, and the full-name cooldown added on top of it). A
    # correction within the 20-minute grace window does not update these.
    last_name_change = models.DateTimeField(null=True, blank=True)
    last_picture_change = models.DateTimeField(null=True, blank=True)
    last_full_name_change = models.DateTimeField(null=True, blank=True)

    newsletter_opt_in = models.BooleanField(default=False)
    tos_accepted_at = models.DateTimeField(null=True, blank=True)
    # Which TosVersion.version this user last agreed to -- compared against
    # the current version to trigger the re-consent pop-up (Section 5c).
    tos_accepted_version = models.PositiveIntegerField(default=1)
    age_confirmed_at = models.DateTimeField(null=True, blank=True)
    email_verified = models.BooleanField(default=False)

    disable_live_notifications = models.BooleanField(default=False)
    disable_away_notifications = models.BooleanField(default=False)
    disable_all_notifications = models.BooleanField(default=False)

    last_seen_rank = models.CharField(
        max_length=10, choices=Rank.choices, null=True, blank=True
    )
    notified_gold = models.BooleanField(default=False)
    notified_top3 = models.BooleanField(default=False)

    moderation_reset_at = models.DateTimeField(null=True, blank=True)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    def __str__(self):
        return self.email

    def public_name(self):
        """The name shown on the leaderboard, per this user's own display preference (Section 7)."""
        if self.name_display_pref == NameDisplayPref.DISPLAY_NAME and self.display_name:
            return self.display_name
        return self.full_name


class TosVersion(models.Model):
    """
    Singleton row (always pk=1): the current Terms of Service version.
    Section 5c: when the Terms materially change, an admin bumps `version`
    here, which trips the re-consent pop-up for every user whose
    tos_accepted_version is behind it. Bumping this is a human judgment call
    ("materially changed"), not automatic.
    """

    version = models.PositiveIntegerField(default=1)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"ToS version {self.version}"

    @classmethod
    def current(cls):
        obj, _ = cls.objects.get_or_create(pk=1, defaults={"version": 1})
        return obj.version
