from django.urls import path

from .views import FundsUpdateListView, VideoPostListView

urlpatterns = [
    path("content/videos/", VideoPostListView.as_view(), name="video-list"),
    path("content/funds-updates/", FundsUpdateListView.as_view(), name="funds-update-list"),
]
