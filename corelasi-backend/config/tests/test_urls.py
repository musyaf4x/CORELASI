from django.test import SimpleTestCase
from django.urls import reverse


class AdminUrlTests(SimpleTestCase):
    def test_django_admin_does_not_conflict_with_frontend_admin_routes(self):
        self.assertEqual(reverse("admin:index"), "/django-admin/")
