from unittest.mock import patch

from django.db import OperationalError
from django.test import TestCase


class HealthEndpointTests(TestCase):
    def test_liveness_does_not_require_database(self):
        with patch("config.views.connection.cursor") as cursor:
            response = self.client.get("/api/health/live/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})
        cursor.assert_not_called()

    def test_readiness_checks_database(self):
        response = self.client.get("/api/health/ready/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ready"})

    @patch(
        "config.views.connection.cursor",
        side_effect=OperationalError("database unavailable"),
    )
    def test_readiness_returns_service_unavailable_without_leaking_error(self, _):
        response = self.client.get("/api/health/ready/")

        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json(), {"status": "unavailable"})
