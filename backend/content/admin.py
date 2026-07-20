from django.contrib import admin

from .models import FundsUpdate, VideoPost


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
