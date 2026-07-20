from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm
from django.utils import timezone

from .models import NameDisplayPref, TosVersion, User


class CustomUserCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ("email", "full_name")


class CustomUserChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = User
        fields = "__all__"


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User
    ordering = ("email",)

    list_display = (
        "email",
        "full_name",
        "display_name",
        "is_staff",
        "email_verified",
        "date_joined",
    )
    list_filter = ("is_staff", "is_active", "email_verified", "last_seen_rank")
    search_fields = ("email", "full_name", "display_name")
    readonly_fields = ("date_joined", "last_login")
    actions = ["reset_moderation"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (
            "Profile",
            {
                "fields": (
                    "full_name",
                    "display_name",
                    "profile_picture_url",
                    "name_display_pref",
                )
            },
        ),
        (
            "Change limits",
            {
                "fields": (
                    "last_name_change",
                    "last_picture_change",
                    "last_full_name_change",
                    "moderation_reset_at",
                )
            },
        ),
        (
            "Consents",
            {
                "fields": (
                    "newsletter_opt_in",
                    "tos_accepted_at",
                    "tos_accepted_version",
                    "age_confirmed_at",
                    "email_verified",
                )
            },
        ),
        (
            "Notification settings",
            {
                "fields": (
                    "disable_live_notifications",
                    "disable_away_notifications",
                    "disable_all_notifications",
                )
            },
        ),
        (
            "Rank tracking",
            {"fields": ("last_seen_rank", "notified_gold", "notified_top3")},
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("email", "full_name", "password1", "password2"),
            },
        ),
    )

    @admin.action(description="Reset display name/photo (moderation takedown)")
    def reset_moderation(self, request, queryset):
        # Section 7b: a moderator-forced reset restores the default state
        # and is explicitly exempt from the 2-week change-limit fields
        # (last_name_change/last_picture_change are deliberately untouched
        # here), so the user can immediately set a new name/photo.
        now = timezone.now()
        updated = queryset.update(
            display_name="",
            profile_picture_url=None,
            name_display_pref=NameDisplayPref.FULL_NAME,
            moderation_reset_at=now,
        )
        self.message_user(request, f"Reset display name/photo for {updated} user(s).")


@admin.register(TosVersion)
class TosVersionAdmin(admin.ModelAdmin):
    list_display = ("version", "updated_at")
    readonly_fields = ("updated_at",)

    def has_add_permission(self, request):
        # Singleton (Section 5c) -- bump the existing row's version rather
        # than creating a second one.
        return not TosVersion.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False
