import io
import shutil
import tempfile

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from PIL import Image
from rest_framework.test import APIClient

from .models import FundsUpdate, GalleryPhoto, VideoPost


def _test_image_file(name="photo.png"):
    buffer = io.BytesIO()
    Image.new("RGB", (20, 20), (100, 150, 200)).save(buffer, format="PNG")
    return SimpleUploadedFile(name, buffer.getvalue(), content_type="image/png")


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


class GalleryPhotoListViewTests(TestCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls._media_dir = tempfile.mkdtemp()
        cls._media_override = override_settings(MEDIA_ROOT=cls._media_dir)
        cls._media_override.enable()

    @classmethod
    def tearDownClass(cls):
        cls._media_override.disable()
        shutil.rmtree(cls._media_dir, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        self.client = APIClient()

    def test_filters_by_category(self):
        GalleryPhoto.objects.create(image=_test_image_file(), category="bio", order=1)
        GalleryPhoto.objects.create(image=_test_image_file(), category="car", order=1)

        resp = self.client.get("/api/content/gallery/?category=bio")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["category"], "bio")

    def test_no_category_returns_all(self):
        GalleryPhoto.objects.create(image=_test_image_file(), category="bio")
        GalleryPhoto.objects.create(image=_test_image_file(), category="car")

        resp = self.client.get("/api/content/gallery/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(len(resp.json()), 2)

    def test_unknown_category_returns_empty_list(self):
        GalleryPhoto.objects.create(image=_test_image_file(), category="bio")

        resp = self.client.get("/api/content/gallery/?category=nonexistent")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json(), [])

    def test_ordered_by_order_field(self):
        GalleryPhoto.objects.create(image=_test_image_file(), category="bio", order=2)
        first = GalleryPhoto.objects.create(image=_test_image_file(), category="bio", order=1)

        resp = self.client.get("/api/content/gallery/?category=bio")
        self.assertEqual(resp.json()[0]["id"], first.id)
