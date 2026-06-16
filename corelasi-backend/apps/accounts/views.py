from django.conf import settings
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import (
    AllowAny,
    BasePermission,
    IsAuthenticated,
    SAFE_METHODS,
)
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.cookies import (
    delete_refresh_cookie,
    disable_auth_response_caching,
    set_refresh_cookie,
)
from accounts.models import User, PasswordResetRequest
from accounts.serializers import (
    CustomTokenObtainPairSerializer, 
    UserDetailSerializer,
    PasswordResetRequestSerializer,
    PasswordResetRequestCreateSerializer
)
from shared.responses import StandardResponse
from shared.access import scope_users_for
from config.throttling import RuntimeScopedRateThrottle

class IsAdminRole(BasePermission):
    """Permission class that grants access only to users with role='admin'."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == "admin"

class IsAdminOrReadOnly(BasePermission):
    """Permission class. Read access to all authenticated, write/delete to admin only."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == "admin"

@method_decorator(csrf_protect, name="dispatch")
class LoginView(TokenObtainPairView):
    """View to handle user login. Uses CustomTokenObtainPairSerializer and wraps response."""
    serializer_class = CustomTokenObtainPairSerializer
    throttle_classes = [RuntimeScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Email atau kata sandi salah.",
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        response_data = dict(serializer.validated_data)
        refresh_token = response_data.pop("refreshToken")
        response = StandardResponse.success(
            data=response_data,
            message="Login berhasil."
        )
        return set_refresh_cookie(response, refresh_token)


@method_decorator(csrf_protect, name="dispatch")
class ShowcaseLoginView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = [RuntimeScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        if not settings.SHOWCASE_MODE:
            return StandardResponse.error(
                message="Mode showcase tidak aktif.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        email = str(request.data.get("email", "")).strip().lower()
        if email not in settings.SHOWCASE_ACCOUNT_EMAILS:
            return StandardResponse.error(
                message="Akun showcase tidak tersedia.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(
            email__iexact=email,
            status="aktif",
            is_active=True,
        ).first()
        if user is None:
            return StandardResponse.error(
                message="Akun showcase tidak tersedia.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        refresh = CustomTokenObtainPairSerializer.get_token(user)
        response = StandardResponse.success(
            data={
                "accessToken": str(refresh.access_token),
                "user": UserDetailSerializer(user).data,
            },
            message="Login showcase berhasil.",
        )
        return set_refresh_cookie(response, str(refresh))


@method_decorator(csrf_protect, name="dispatch")
class CustomTokenRefreshView(TokenRefreshView):
    """Rotate the refresh cookie and return a short-lived access token."""
    authentication_classes = ()
    permission_classes = (AllowAny,)
    throttle_classes = [RuntimeScopedRateThrottle]
    throttle_scope = "token_refresh"
    
    def post(self, request, *args, **kwargs):
        refresh_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)
        if not refresh_token:
            response = StandardResponse.error(
                message="Sesi tidak valid atau telah berakhir.",
                status_code=status.HTTP_401_UNAUTHORIZED,
            )
            return delete_refresh_cookie(response)

        serializer = self.get_serializer(data={"refresh": refresh_token})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            errors = getattr(e, "detail", None)
            response = StandardResponse.error(
                message="Sesi tidak valid atau telah berakhir.",
                errors=errors,
                status_code=status.HTTP_401_UNAUTHORIZED
            )
            return delete_refresh_cookie(response)
            
        response = StandardResponse.success(
            data={"accessToken": serializer.validated_data["access"]},
            message="Token berhasil diperbarui."
        )
        rotated_refresh = serializer.validated_data.get("refresh")
        if rotated_refresh:
            return set_refresh_cookie(response, rotated_refresh)
        return disable_auth_response_caching(response)


class CsrfTokenView(APIView):
    authentication_classes = ()
    permission_classes = (AllowAny,)

    def get(self, request):
        response = StandardResponse.success(
            data={"csrfToken": get_token(request)},
            message="CSRF cookie berhasil disiapkan.",
        )
        return disable_auth_response_caching(response)

class ProfileView(APIView):
    """View to retrieve the authenticated user's profile."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        serializer = UserDetailSerializer(request.user)
        return StandardResponse.success(
            data=serializer.data,
            message="Profil berhasil dimuat."
        )


class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        current_password = request.data.get("currentPassword", "")
        new_password = request.data.get("newPassword", "")

        if not request.user.check_password(current_password):
            return StandardResponse.error(
                message="Kata sandi saat ini salah.",
                errors={"currentPassword": ["Kata sandi saat ini salah."]},
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_password(new_password, user=request.user)
        except ValidationError as exc:
            return StandardResponse.error(
                message="Kata sandi baru tidak memenuhi persyaratan keamanan.",
                errors={"newPassword": list(exc.messages)},
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        request.user.set_password(new_password)
        request.user.save(update_fields=["password"])
        return StandardResponse.success(message="Kata sandi berhasil diperbarui.")


@method_decorator(csrf_protect, name="dispatch")
class LogoutView(APIView):
    """Blacklist the refresh token and clear its browser cookie."""
    authentication_classes = ()
    permission_classes = (AllowAny,)

    def post(self, request):
        refresh_token = request.COOKIES.get(settings.AUTH_REFRESH_COOKIE_NAME)
        if refresh_token:
            try:
                RefreshToken(refresh_token).blacklist()
            except TokenError:
                pass

        response = StandardResponse.success(
            message="Logout berhasil."
        )
        return delete_refresh_cookie(response)

class UserViewSet(viewsets.ModelViewSet):
    """ViewSet to handle User CRUD. Read is allowed for all authenticated users; Write is Admin-only."""
    queryset = User.objects.all().select_related("kelas")
    serializer_class = UserDetailSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        return scope_users_for(self.request.user, super().get_queryset())

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return StandardResponse.success(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return StandardResponse.success(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Pengguna baru berhasil dibuat.",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Gagal membuat pengguna baru.",
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Data pengguna berhasil diperbarui."
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Gagal memperbarui data pengguna.",
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        if instance.id == request.user.id:
            return StandardResponse.error(
                message="Admin tidak dapat menghapus akun sendiri.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        try:
            self.perform_destroy(instance)
            return StandardResponse.success(
                message="Pengguna berhasil dihapus.",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return StandardResponse.error(
                message="Gagal menghapus pengguna.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

class PasswordResetRequestViewSet(viewsets.ModelViewSet):
    """ViewSet to handle PasswordResetRequest objects."""
    queryset = PasswordResetRequest.objects.all().select_related("user")
    serializer_class = PasswordResetRequestSerializer

    def get_throttles(self):
        if self.action == "create":
            self.throttle_classes = [RuntimeScopedRateThrottle]
            self.throttle_scope = "password_reset"
        return super().get_throttles()

    def get_permissions(self):
        if self.action == "create":
            # Creation request is anonymous/unauthenticated
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsAdminRole()]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return StandardResponse.success(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return StandardResponse.success(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = PasswordResetRequestCreateSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            errors = getattr(e, "detail", None)
            error_msg = "Gagal membuat permintaan reset password."
            if errors and "email" in errors:
                error_msg = errors["email"][0]
            return StandardResponse.error(
                message=error_msg,
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        email = serializer.validated_data["email"]
        user = User.objects.get(email__iexact=email)
        
        reset_request = PasswordResetRequest.objects.create(user=user, status="pending")
        
        return StandardResponse.success(
            message="Permintaan reset password berhasil diajukan.",
            status_code=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=["patch"])
    def resolve(self, request, pk=None):
        reset_request = self.get_object()
        if reset_request.status == "resolved":
            return StandardResponse.error(
                message="Permintaan reset password ini sudah selesai diproses.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        import random
        # Generate temporary password starting with "pwd-" and 6 digits
        temp_password = f"pwd-{random.randint(100000, 999999)}"
        
        user = reset_request.user
        user.set_password(temp_password)
        user.save()
        
        reset_request.status = "resolved"
        reset_request.save()
        
        return StandardResponse.success(
            data={"tempPassword": temp_password},
            message="Password berhasil di-reset."
        )
