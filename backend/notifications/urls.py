from django.urls import path

from .views import LoginEventsView

urlpatterns = [
    path("notifications/login-events/", LoginEventsView.as_view(), name="login-events"),
]
