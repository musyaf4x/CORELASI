from django.test import TestCase, override_settings


@override_settings(SECURE_SSL_REDIRECT=False)
class SecurityHeaderTests(TestCase):
    def test_api_response_has_security_headers(self):
        response = self.client.get("/api/health/live/")

        self.assertEqual(response["X-Content-Type-Options"], "nosniff")
        self.assertEqual(response["X-Frame-Options"], "DENY")
        self.assertEqual(response["Referrer-Policy"], "same-origin")
        self.assertIn("default-src 'self'", response["Content-Security-Policy"])
        self.assertIn("camera=()", response["Permissions-Policy"])
