from rest_framework.generics import ListAPIView
from rest_framework.permissions import AllowAny

from .models import FundsUpdate, VideoPost
from .serializers import FundsUpdateSerializer, VideoPostSerializer


class VideoPostListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = VideoPostSerializer
    queryset = VideoPost.objects.all()


class FundsUpdateListView(ListAPIView):
    permission_classes = [AllowAny]
    serializer_class = FundsUpdateSerializer
    queryset = FundsUpdate.objects.all()
