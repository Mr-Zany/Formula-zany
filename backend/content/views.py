from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny

from .models import FundsUpdate, GalleryPhoto, VideoPost
from .serializers import FundsUpdateSerializer, GalleryPhotoSerializer, VideoPostSerializer


class VideoPostListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = VideoPostSerializer
    queryset = VideoPost.objects.all()


class FundsUpdateListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = FundsUpdateSerializer
    queryset = FundsUpdate.objects.all()


class GalleryPhotoListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = GalleryPhotoSerializer

    def get_queryset(self):
        queryset = GalleryPhoto.objects.all()
        category = self.request.query_params.get("category")
        if category:
            queryset = queryset.filter(category=category)
        return queryset
