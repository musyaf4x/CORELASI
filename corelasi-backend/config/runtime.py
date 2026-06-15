from collections.abc import Mapping
from urllib.parse import urlsplit

from django.core.exceptions import ImproperlyConfigured


INSECURE_SECRET_MARKERS = (
    "django-insecure",
    "change-me",
    "changeme",
    "placeholder",
    "replace-with",
)


def parse_bool(value, default=False):
    if value in (None, ""):
        return default
    if isinstance(value, bool):
        return value
    normalized = str(value).strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ImproperlyConfigured(f"Invalid boolean value: {value!r}")


def parse_csv(value):
    if not value:
        return []
    return [item.strip() for item in str(value).split(",") if item.strip()]


def parse_int(value, default):
    if value in (None, ""):
        return default
    try:
        return int(value)
    except (TypeError, ValueError) as exc:
        raise ImproperlyConfigured(f"Invalid integer value: {value!r}") from exc


def _validate_https_origins(name, origins):
    for origin in origins:
        parsed = urlsplit(origin)
        if (
            parsed.scheme != "https"
            or not parsed.netloc
            or parsed.path not in ("", "/")
            or parsed.query
            or parsed.fragment
        ):
            raise ImproperlyConfigured(
                f"{name} must contain exact https:// origins without paths."
            )


def validate_database_password(password, debug, engine):
    if debug or str(engine).strip().lower() == "sqlite":
        return

    normalized = str(password or "").strip()
    lowered = normalized.lower()
    if len(normalized) < 20 or any(
        marker in lowered for marker in INSECURE_SECRET_MARKERS
    ):
        raise ImproperlyConfigured(
            "POSTGRES_PASSWORD must be non-placeholder and at least 20 characters."
        )


def build_runtime_config(values: Mapping):
    debug = parse_bool(values.get("DEBUG"), default=False)
    secret_key = str(values.get("SECRET_KEY") or "").strip()
    if not secret_key:
        raise ImproperlyConfigured("SECRET_KEY must be configured.")

    local_hosts = ["localhost", "127.0.0.1"]
    local_origin = ["http://localhost:5173"]
    allowed_hosts = parse_csv(values.get("ALLOWED_HOSTS")) or (
        local_hosts if debug else []
    )
    cors_origins = parse_csv(values.get("CORS_ALLOWED_ORIGINS")) or (
        local_origin if debug else []
    )
    csrf_origins = parse_csv(values.get("CSRF_TRUSTED_ORIGINS")) or (
        local_origin if debug else []
    )

    if not debug:
        lowered_secret = secret_key.lower()
        if len(secret_key) < 50 or any(
            marker in lowered_secret for marker in INSECURE_SECRET_MARKERS
        ):
            raise ImproperlyConfigured(
                "SECRET_KEY must be unique, non-placeholder, and at least 50 characters."
            )
        if not allowed_hosts or "*" in allowed_hosts:
            raise ImproperlyConfigured(
                "ALLOWED_HOSTS must list explicit production hostnames."
            )
        if not cors_origins or not csrf_origins:
            raise ImproperlyConfigured(
                "CORS_ALLOWED_ORIGINS and CSRF_TRUSTED_ORIGINS are required."
            )
        _validate_https_origins("CORS_ALLOWED_ORIGINS", cors_origins)
        _validate_https_origins("CSRF_TRUSTED_ORIGINS", csrf_origins)

    trust_proxy = parse_bool(
        values.get("TRUST_PROXY_HEADERS"),
        default=not debug,
    )
    ssl_redirect = parse_bool(
        values.get("SECURE_SSL_REDIRECT"),
        default=not debug,
    )
    secure_cookies = parse_bool(
        values.get("SECURE_COOKIES"),
        default=not debug,
    )
    hsts_seconds = parse_int(
        values.get("SECURE_HSTS_SECONDS"),
        0 if debug else 31536000,
    )

    return {
        "DEBUG": debug,
        "SECRET_KEY": secret_key,
        "ALLOWED_HOSTS": allowed_hosts,
        "CORS_ALLOWED_ORIGINS": cors_origins,
        "CSRF_TRUSTED_ORIGINS": csrf_origins,
        "CORS_ALLOW_CREDENTIALS": parse_bool(
            values.get("CORS_ALLOW_CREDENTIALS"),
            default=False,
        ),
        "SECURE_SSL_REDIRECT": ssl_redirect,
        "SESSION_COOKIE_SECURE": secure_cookies,
        "CSRF_COOKIE_SECURE": secure_cookies,
        "SECURE_HSTS_SECONDS": hsts_seconds,
        "SECURE_HSTS_INCLUDE_SUBDOMAINS": parse_bool(
            values.get("SECURE_HSTS_INCLUDE_SUBDOMAINS"),
            default=not debug,
        ),
        "SECURE_HSTS_PRELOAD": parse_bool(
            values.get("SECURE_HSTS_PRELOAD"),
            default=not debug,
        ),
        "SECURE_PROXY_SSL_HEADER": (
            ("HTTP_X_FORWARDED_PROTO", "https") if trust_proxy else None
        ),
        "USE_X_FORWARDED_HOST": trust_proxy,
    }
