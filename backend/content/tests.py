from django.test import TestCase
from rest_framework.test import APIClient

from .models import FundsUpdate, VideoPost


class VideoPostListViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_returns_videos_ordered_by_order_field(self):
        VideoPost.objects.create(
            title="Second",
            platform=VideoPost.Platform.YOUTUBE,
            content_type=VideoPost.ContentType.VIDEO,
            url="https://youtube.com/watch?v=2",
            creator_name="Zane",
            order=2,
        )
        VideoPost.objects.create(
            title="First",
            platform=VideoPost.Platform.TIKTOK,
            content_type=VideoPost.ContentType.SHORT,
            url="https://tiktok.com/@zane/video/1",
            creator_name="Zane",
            order=1,
        )
        resp = self.client.get("/api/content/videos/")
        self.assertEqual(resp.status_code, 200)
        titles = [v["title"] for v in resp.json()]
        self.assertEqual(titles, ["First", "Second"])


class FundsUpdateListViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_returns_updates_newest_first(self):
        older = FundsUpdate.objects.create(text="Engine deposit paid -- $1,200.")
        newer = FundsUpdate.objects.create(text="$500 spent on the roll cage this week.")
        resp = self.client.get("/api/content/funds-updates/")
        self.assertEqual(resp.status_code, 200)
        texts = [u["text"] for u in resp.json()]
        self.assertEqual(texts, [newer.text, older.text])
