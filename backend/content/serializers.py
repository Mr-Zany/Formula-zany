from rest_framework import serializers

from .models import FundsUpdate, GalleryPhoto, VideoPost


class VideoPostSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoPost
        fields = [
            "id",
            "title",
            "platform",
            "content_type",
            "url",
            "creator_name",
            "creator_picture_url",
        ]


class FundsUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = FundsUpdate
        fields = ["id", "text", "created_at"]


class GalleryPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = GalleryPhoto
        fields = ["id", "image", "category", "caption"]
