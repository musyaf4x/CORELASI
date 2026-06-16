from rest_framework_simplejwt.authentication import JWTAuthentication


class ShowcaseProtectedJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        return super().authenticate(request)
