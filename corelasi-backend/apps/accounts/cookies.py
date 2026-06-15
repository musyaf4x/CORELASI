from django.conf import settings


def disable_auth_response_caching(response):
    response["Cache-Control"] = "no-store"
    response["Pragma"] = "no-cache"
    return response


def set_refresh_cookie(response, token):
    response.set_cookie(
        key=settings.AUTH_REFRESH_COOKIE_NAME,
        value=token,
        max_age=settings.AUTH_REFRESH_COOKIE_MAX_AGE,
        path=settings.AUTH_REFRESH_COOKIE_PATH,
        secure=settings.AUTH_REFRESH_COOKIE_SECURE,
        httponly=True,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
    )
    return disable_auth_response_caching(response)


def delete_refresh_cookie(response):
    response.delete_cookie(
        key=settings.AUTH_REFRESH_COOKIE_NAME,
        path=settings.AUTH_REFRESH_COOKIE_PATH,
        samesite=settings.AUTH_REFRESH_COOKIE_SAMESITE,
    )
    return disable_auth_response_caching(response)
