from collections.abc import Mapping
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured


POSTGRES_REQUIRED_SETTINGS = (
    "POSTGRES_DB",
    "POSTGRES_USER",
    "POSTGRES_PASSWORD",
    "DB_HOST",
    "DB_PORT",
)


def build_database_config(
    values: Mapping[str, str | None],
    base_dir: Path,
) -> dict[str, object]:
    engine = (values.get("DB_ENGINE") or "postgresql").strip().lower()

    if engine == "sqlite":
        return {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": base_dir / "db.sqlite3",
        }

    if engine not in {"postgres", "postgresql"}:
        raise ImproperlyConfigured(f"Unsupported DB_ENGINE '{engine}'")

    missing = [
        setting
        for setting in POSTGRES_REQUIRED_SETTINGS
        if not values.get(setting)
    ]
    if missing:
        raise ImproperlyConfigured(
            "Missing required PostgreSQL settings: " + ", ".join(missing)
        )

    return {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": values["POSTGRES_DB"],
        "USER": values["POSTGRES_USER"],
        "PASSWORD": values["POSTGRES_PASSWORD"],
        "HOST": values["DB_HOST"],
        "PORT": values["DB_PORT"],
        "CONN_MAX_AGE": int(values.get("DB_CONN_MAX_AGE") or 0),
        "CONN_HEALTH_CHECKS": True,
        "OPTIONS": {
            "connect_timeout": int(values.get("DB_CONNECT_TIMEOUT") or 5),
        },
    }
