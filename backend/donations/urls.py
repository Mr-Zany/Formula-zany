from django.urls import path

from .views import DonateView, LeaderboardView

urlpatterns = [
    path("leaderboard/", LeaderboardView.as_view(), name="leaderboard"),
    path("donate/", DonateView.as_view(), name="donate"),
]
