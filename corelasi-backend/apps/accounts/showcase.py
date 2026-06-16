from django.conf import settings


def is_showcase_account(user):
    if not settings.SHOWCASE_MODE or not user or not user.is_authenticated:
        return False
    return user.email.lower() in settings.SHOWCASE_ACCOUNT_EMAILS
