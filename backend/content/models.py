from django.db import models


class VideoPost(models.Model):
    """
    Section 4d: rotating video carousel. Entries are added manually (title +
    platform picked by hand) rather than pulled automatically via each
    platform's API -- the embed itself comes from the link. Facebook/
    Instagram values are valid here even though the frontend doesn't render
    an embed for them yet (that needs a Meta Developer app that doesn't
    exist) -- adding that embed type later is additive, not a model change.
    """

    class Platform(models.TextChoices):
        YOUTUBE = "youtube", "YouTube"
        TIKTOK = "tiktok", "TikTok"
        INSTAGRAM = "instagram", "Instagram"
        FACEBOOK = "facebook", "Facebook"

    class ContentType(models.TextChoices):
        SHORT = "short", "Short"
        VIDEO = "video", "Video"

    title = models.CharField(max_length=200)
    platform = models.CharField(max_length=20, choices=Platform.choices)
    content_type = models.CharField(max_length=10, choices=ContentType.choices)
    url = models.URLField()
    creator_name = models.CharField(max_length=150)
    creator_picture_url = models.URLField(blank=True, null=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return f"{self.title} ({self.platform})"


class FundsUpdate(models.Model):
    """Section 4f: short admin-authored spending log, e.g. "$500 spent on
    the roll cage this week." Not a full accounting ledger."""

    text = models.CharField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.text[:60]


class GalleryPhoto(models.Model):
    """
    Admin-uploadable photo pool for the site's placeholder image slots
    (About Us bio/car photo, Sponsorships left/right image). `category` is
    free text rather than fixed choices, so a new slot can be introduced
    later without a migration -- today's values are "bio", "car",
    "sponsorship_left", "sponsorship_right". Each frontend slot fetches its
    own category and picks one photo at random client-side, so the page
    looks different on every reload.
    """

    image = models.ImageField(upload_to="gallery/")
    category = models.CharField(max_length=50)
    caption = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "-created_at"]

    def __str__(self):
        return f"{self.category}: {self.caption or self.image.name}"
