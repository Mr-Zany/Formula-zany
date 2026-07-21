from django.contrib import admin
from django.utils.html import format_html

from .models import FundsUpdate, GalleryPhoto, VideoPost


@admin.register(VideoPost)
class VideoPostAdmin(admin.ModelAdmin):
    list_display = ("title", "platform", "content_type", "creator_name", "order", "created_at")
    list_filter = ("platform", "content_type")
    search_fields = ("title", "creator_name")
    ordering = ("order", "-created_at")


@admin.register(FundsUpdate)
class FundsUpdateAdmin(admin.ModelAdmin):
    list_display = ("text", "created_at")
    ordering = ("-created_at",)


@admin.register(GalleryPhoto)
class GalleryPhotoAdmin(admin.ModelAdmin):
    list_display = ("thumbnail", "category", "caption", "order", "created_at")
    list_filter = ("category",)
    search_fields = ("category", "caption")
    ordering = ("order", "-created_at")

    def thumbnail(self, obj):
        if not obj.image:
            return "(no image)"
        return format_html(
            '<img src="{}" style="height:60px;border-radius:4px;object-fit:cover;" />',
            obj.image.url,
        )

    thumbnail.short_description = "Preview"
