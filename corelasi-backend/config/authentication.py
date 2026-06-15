from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts.showcase import is_showcase_account


class ShowcaseProtectedJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        result = super().authenticate(request)
        if result is None:
            return None

        user, token = result
        if request.method == "DELETE" and is_showcase_account(user):
            raise PermissionDenied(
                "Akun showcase tidak dapat menghapus data."
            )
        return user, token
