from django.test import TestCase
from rest_framework.test import APIClient


class ContactViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_valid_submission_succeeds(self):
        resp = self.client.post(
            "/api/contact/",
            {"name": "Jamie Doe", "email": "jamie@example.com", "message": "Great project!"},
            format="json",
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIn("detail", resp.json())

    def test_missing_fields_rejected(self):
        resp = self.client.post("/api/contact/", {"name": "Jamie Doe"}, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("email", resp.json())
        self.assertIn("message", resp.json())

    def test_blank_message_rejected(self):
        resp = self.client.post(
            "/api/contact/",
            {"name": "Jamie Doe", "email": "jamie@example.com", "message": ""},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)

    def test_invalid_email_rejected(self):
        resp = self.client.post(
            "/api/contact/",
            {"name": "Jamie Doe", "email": "not-an-email", "message": "Hi"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400)
