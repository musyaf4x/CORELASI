"""
Django settings for CORELASI project.
"""

import os
import sys
from datetime import timedelta
from pathlib import Path
from decouple import config
from config.database import build_database_config
from config.logging import build_logging_config
from config.runtime import (
    build_runtime_config,
    parse_csv,
    validate_database_password,
)

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Add apps directory to python path
sys.path.insert(0, os.path.join(BASE_DIR, "apps"))

RUNTIME = build_runtime_config(
    {
        "DEBUG": config("DEBUG", default="false"),
        "SECRET_KEY": config("SECRET_KEY", default=""),
        "ALLOWED_HOSTS": config("ALLOWED_HOSTS", default=""),
        "CORS_ALLOWED_ORIGINS": config("CORS_ALLOWED_ORIGINS", default=""),
        "CSRF_TRUSTED_ORIGINS": config("CSRF_TRUSTED_ORIGINS", default=""),
        "CORS_ALLOW_CREDENTIALS": config(
            "CORS_ALLOW_CREDENTIALS",
            default="false",
        ),
        "TRUST_PROXY_HEADERS": config("TRUST_PROXY_HEADERS", default=""),
        "SECURE_SSL_REDIRECT": config("SECURE_SSL_REDIRECT", default=""),
        "SECURE_COOKIES": config("SECURE_COOKIES", default=""),
        "SECURE_HSTS_SECONDS": config("SECURE_HSTS_SECONDS", default=""),
        "SECURE_HSTS_INCLUDE_SUBDOMAINS": config(
            "SECURE_HSTS_INCLUDE_SUBDOMAINS",
            default="",
        ),
        "SECURE_HSTS_PRELOAD": config("SECURE_HSTS_PRELOAD", default=""),
    }
)

SECRET_KEY = RUNTIME["SECRET_KEY"]
DEBUG = RUNTIME["DEBUG"]
ALLOWED_HOSTS = RUNTIME["ALLOWED_HOSTS"]

# Application definition

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party apps
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    # Local apps
    "accounts",
    "academic",
    "schedules",
    "attendance",
    "learning",
    "journals",
    "reports",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "config.middleware.SecurityHeadersMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases

DB_ENGINE_VALUE = config("DB_ENGINE", default="postgresql")
POSTGRES_PASSWORD_VALUE = config("POSTGRES_PASSWORD", default="")
validate_database_password(
    POSTGRES_PASSWORD_VALUE,
    debug=DEBUG,
    engine=DB_ENGINE_VALUE,
)

DATABASES = {
    "default": build_database_config(
        {
            "DB_ENGINE": DB_ENGINE_VALUE,
            "POSTGRES_DB": config("POSTGRES_DB", default=None),
            "POSTGRES_USER": config("POSTGRES_USER", default=None),
            "POSTGRES_PASSWORD": POSTGRES_PASSWORD_VALUE,
            "DB_HOST": config("DB_HOST", default=None),
            "DB_PORT": config("DB_PORT", default=None),
            "DB_CONN_MAX_AGE": config("DB_CONN_MAX_AGE", default="0"),
            "DB_CONNECT_TIMEOUT": config("DB_CONNECT_TIMEOUT", default="5"),
        },
        BASE_DIR,
    )
}

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Custom User Model
AUTH_USER_MODEL = "accounts.User"

# Internationalization
# https://docs.djangoproject.com/en/5.0/topics/i18n/

LANGUAGE_CODE = "id"  # Indonesian localization
TIME_ZONE = "Asia/Jakarta"  # Indonesian timezone
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

STORAGES = {
    "default": {
        "BACKEND": "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        "BACKEND": (
            "django.contrib.staticfiles.storage.StaticFilesStorage"
            if DEBUG
            else "whitenoise.storage.CompressedManifestStaticFilesStorage"
        ),
    },
}
WHITENOISE_MAX_AGE = 31536000 if not DEBUG else 0

# Default primary key field type
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS Configuration
CORS_ALLOW_CREDENTIALS = RUNTIME["CORS_ALLOW_CREDENTIALS"]
CORS_ALLOWED_ORIGINS = RUNTIME["CORS_ALLOWED_ORIGINS"]
CSRF_TRUSTED_ORIGINS = RUNTIME["CSRF_TRUSTED_ORIGINS"]

# HTTPS, reverse proxy, cookies, and browser security.
SECURE_SSL_REDIRECT = RUNTIME["SECURE_SSL_REDIRECT"]
SESSION_COOKIE_SECURE = RUNTIME["SESSION_COOKIE_SECURE"]
CSRF_COOKIE_SECURE = RUNTIME["CSRF_COOKIE_SECURE"]
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_HTTPONLY = False
SECURE_HSTS_SECONDS = RUNTIME["SECURE_HSTS_SECONDS"]
SECURE_HSTS_INCLUDE_SUBDOMAINS = RUNTIME["SECURE_HSTS_INCLUDE_SUBDOMAINS"]
SECURE_HSTS_PRELOAD = RUNTIME["SECURE_HSTS_PRELOAD"]
SECURE_PROXY_SSL_HEADER = RUNTIME["SECURE_PROXY_SSL_HEADER"]
USE_X_FORWARDED_HOST = RUNTIME["USE_X_FORWARDED_HOST"]
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

CONTENT_SECURITY_POLICY = config(
    "CONTENT_SECURITY_POLICY",
    default=(
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:; "
        "font-src 'self' data:; "
        "connect-src 'self'; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "frame-ancestors 'none'; "
        "form-action 'self'"
    ),
)
PERMISSIONS_POLICY = config(
    "PERMISSIONS_POLICY",
    default=(
        "accelerometer=(), autoplay=(), camera=(), geolocation=(), "
        "gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
    ),
)

SHOWCASE_MODE = config("SHOWCASE_MODE", default=False, cast=bool)
SHOWCASE_ACCOUNT_EMAILS = frozenset(
    email.lower()
    for email in parse_csv(config("SHOWCASE_ACCOUNT_EMAILS", default=""))
)

# Django REST Framework Configuration
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "config.authentication.ShowcaseProtectedJWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": config("THROTTLE_ANON_RATE", default="120/min"),
        "user": config("THROTTLE_USER_RATE", default="1200/min"),
        "login": config("THROTTLE_LOGIN_RATE", default="10/min"),
        "token_refresh": config(
            "THROTTLE_TOKEN_REFRESH_RATE",
            default="30/min",
        ),
        "password_reset": config(
            "THROTTLE_PASSWORD_RESET_RATE",
            default="3/hour",
        ),
        "upload": config("THROTTLE_UPLOAD_RATE", default="20/hour"),
    },
    "NUM_PROXIES": config("DRF_NUM_PROXIES", default=0, cast=int),
    # Use JSON renderer as default
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
}

# SimpleJWT Configuration
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=15),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=7),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": True,
    "ALGORITHM": "HS256",
    "SIGNING_KEY": SECRET_KEY,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "AUTH_HEADER_NAME": "HTTP_AUTHORIZATION",
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

AUTH_REFRESH_COOKIE_NAME = config(
    "AUTH_REFRESH_COOKIE_NAME",
    default="corelasi_refresh",
)
AUTH_REFRESH_COOKIE_MAX_AGE = config(
    "AUTH_REFRESH_COOKIE_MAX_AGE",
    default=7 * 24 * 60 * 60,
    cast=int,
)
AUTH_REFRESH_COOKIE_PATH = "/api/auth/"
AUTH_REFRESH_COOKIE_SECURE = RUNTIME["SESSION_COOKIE_SECURE"]
AUTH_REFRESH_COOKIE_SAMESITE = "Lax"

FILE_UPLOAD_MAX_MEMORY_SIZE = config(
    "FILE_UPLOAD_MAX_MEMORY_SIZE",
    default=10 * 1024 * 1024,
    cast=int,
)
DATA_UPLOAD_MAX_MEMORY_SIZE = config(
    "DATA_UPLOAD_MAX_MEMORY_SIZE",
    default=11 * 1024 * 1024,
    cast=int,
)
MAX_UPLOAD_SIZE = config(
    "MAX_UPLOAD_SIZE",
    default=10 * 1024 * 1024,
    cast=int,
)

LOGGING = build_logging_config(
    config(
        "LOG_FILE",
        default=str(BASE_DIR / "logs" / "corelasi.log"),
    )
)
