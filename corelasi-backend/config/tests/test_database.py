from pathlib import Path
from unittest import TestCase

from django.core.exceptions import ImproperlyConfigured

from config.database import build_database_config


class DatabaseConfigTests(TestCase):
    def test_builds_postgresql_config_with_health_checks(self):
        values = {
            "DB_ENGINE": "postgresql",
            "POSTGRES_DB": "corelasi",
            "POSTGRES_USER": "corelasi_app",
            "POSTGRES_PASSWORD": "secret",
            "DB_HOST": "127.0.0.1",
            "DB_PORT": "5432",
            "DB_CONN_MAX_AGE": "0",
            "DB_CONNECT_TIMEOUT": "5",
        }

        database = build_database_config(values, Path("/tmp"))

        self.assertEqual(database["ENGINE"], "django.db.backends.postgresql")
        self.assertEqual(database["NAME"], "corelasi")
        self.assertEqual(database["USER"], "corelasi_app")
        self.assertEqual(database["HOST"], "127.0.0.1")
        self.assertEqual(database["PORT"], "5432")
        self.assertEqual(database["CONN_MAX_AGE"], 0)
        self.assertTrue(database["CONN_HEALTH_CHECKS"])
        self.assertEqual(database["OPTIONS"]["connect_timeout"], 5)

    def test_postgresql_requires_all_connection_values(self):
        values = {
            "DB_ENGINE": "postgresql",
            "POSTGRES_DB": "corelasi",
            "POSTGRES_USER": "corelasi_app",
        }

        with self.assertRaisesRegex(
            ImproperlyConfigured,
            "POSTGRES_PASSWORD, DB_HOST, DB_PORT",
        ):
            build_database_config(values, Path("/tmp"))

    def test_sqlite_is_available_only_when_explicitly_requested(self):
        database = build_database_config(
            {"DB_ENGINE": "sqlite"},
            Path("C:/project/corelasi-backend"),
        )

        self.assertEqual(database["ENGINE"], "django.db.backends.sqlite3")
        self.assertEqual(
            database["NAME"],
            Path("C:/project/corelasi-backend/db.sqlite3"),
        )

    def test_rejects_unknown_database_engine(self):
        with self.assertRaisesRegex(
            ImproperlyConfigured,
            "Unsupported DB_ENGINE 'mysql'",
        ):
            build_database_config(
                {"DB_ENGINE": "mysql"},
                Path("/tmp"),
            )
