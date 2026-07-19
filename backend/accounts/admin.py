from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import UserChangeForm, UserCreationForm

from .models import User


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
