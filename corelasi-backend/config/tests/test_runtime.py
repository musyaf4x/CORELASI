from unittest import TestCase

from django.core.exceptions import ImproperlyConfigured

from config.runtime import (
    build_runtime_config,
    parse_csv,
    validate_database_password,
)


class ParseCsvTests(TestCase):
    def test_trims_and_drops_empty_values(self):
        self.assertEqual(
            parse_csv(" corelasi.test, ,api.corelasi.test "),
            ["corelasi.test", "api.corelasi.test"],
        )


class RuntimeConfigTests(TestCase):
    def test_debug_mode_keeps_local_defaults(self):
        runtime = build_runtime_config(
            {
                "DEBUG": "true",
                "SECRET_KEY": "django-insecure-local-only",
            }
        )

        self.assertTrue(runtime["DEBUG"])
        self.assertEqual(runtime["ALLOWED_HOSTS"], ["localhost", "127.0.0.1"])
        self.assertEqual(
            runtime["CORS_ALLOWED_ORIGINS"],
            ["http://localhost:5173"],
        )
        self.assertFalse(runtime["SECURE_SSL_REDIRECT"])

    def test_production_requires_a_strong_secret(self):
        with self.assertRaisesRegex(ImproperlyConfigured, "SECRET_KEY"):
            build_runtime_config(
                {
                    "DEBUG": "false",
                    "SECRET_KEY": "django-insecure-placeholder",
                    "ALLOWED_HOSTS": "corelasi.test",
                    "CORS_ALLOWED_ORIGINS": "https://corelasi.test",
                    "CSRF_TRUSTED_ORIGINS": "https://corelasi.test",
                }
            )

    def test_production_rejects_documented_placeholder_secret(self):
        with self.assertRaisesRegex(ImproperlyConfigured, "SECRET_KEY"):
            build_runtime_config(
                {
                    "DEBUG": "false",
                    "SECRET_KEY": (
                        "replace-with-a-unique-random-secret-of-at-least-50-characters"
                    ),
                    "ALLOWED_HOSTS": "corelasi.test",
                    "CORS_ALLOWED_ORIGINS": "https://corelasi.test",
                    "CSRF_TRUSTED_ORIGINS": "https://corelasi.test",
                }
            )

    def test_production_rejects_wildcard_hosts(self):
        with self.assertRaisesRegex(ImproperlyConfigured, "ALLOWED_HOSTS"):
            build_runtime_config(
                {
                    "DEBUG": "false",
                    "SECRET_KEY": "a-production-secret-that-is-longer-than-fifty-characters",
                    "ALLOWED_HOSTS": "*",
                    "CORS_ALLOWED_ORIGINS": "https://corelasi.test",
                    "CSRF_TRUSTED_ORIGINS": "https://corelasi.test",
                }
            )

    def test_production_requires_https_trusted_origins(self):
        with self.assertRaisesRegex(ImproperlyConfigured, "https://"):
            build_runtime_config(
                {
                    "DEBUG": "false",
                    "SECRET_KEY": "a-production-secret-that-is-longer-than-fifty-characters",
                    "ALLOWED_HOSTS": "corelasi.test",
                    "CORS_ALLOWED_ORIGINS": "http://corelasi.test",
                    "CSRF_TRUSTED_ORIGINS": "http://corelasi.test",
                }
            )

    def test_production_builds_secure_defaults(self):
        runtime = build_runtime_config(
            {
                "DEBUG": "false",
                "SECRET_KEY": "a-production-secret-that-is-longer-than-fifty-characters",
                "ALLOWED_HOSTS": "corelasi.test",
                "CORS_ALLOWED_ORIGINS": "https://corelasi.test",
                "CSRF_TRUSTED_ORIGINS": "https://corelasi.test",
            }
        )

        self.assertTrue(runtime["SECURE_SSL_REDIRECT"])
        self.assertTrue(runtime["SESSION_COOKIE_SECURE"])
        self.assertTrue(runtime["CSRF_COOKIE_SECURE"])
        self.assertEqual(runtime["SECURE_HSTS_SECONDS"], 31536000)
        self.assertEqual(
            runtime["SECURE_PROXY_SSL_HEADER"],
            ("HTTP_X_FORWARDED_PROTO", "https"),
        )


class DatabasePasswordTests(TestCase):
    def test_production_rejects_placeholder_database_password(self):
        with self.assertRaisesRegex(
            ImproperlyConfigured,
            "POSTGRES_PASSWORD",
        ):
            validate_database_password(
                "replace-with-a-random-password",
                debug=False,
                engine="postgresql",
            )

    def test_debug_and_explicit_sqlite_do_not_require_production_password(self):
        validate_database_password("local", debug=True, engine="postgresql")
        validate_database_password("", debug=False, engine="sqlite")
