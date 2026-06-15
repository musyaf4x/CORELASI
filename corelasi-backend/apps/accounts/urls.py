from django.urls import path, include
from rest_framework.routers import SimpleRouter
from accounts.views import (
    CsrfTokenView,
    LoginView,
    ShowcaseLoginView,
    CustomTokenRefreshView, 
    ProfileView, 
    ChangePasswordView,
    LogoutView,
    UserViewSet,
    PasswordResetRequestViewSet
)

app_name = "accounts"

router = SimpleRouter()
router.register("users/password-reset-requests", PasswordResetRequestViewSet, basename="password-reset-requests")
router.register("users", UserViewSet, basename="users")

urlpatterns = [
    path("auth/csrf/", CsrfTokenView.as_view(), name="csrf"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path(
        "auth/showcase-login/",
        ShowcaseLoginView.as_view(),
        name="showcase_login",
    ),
    path("auth/refresh/", CustomTokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", ProfileView.as_view(), name="profile"),
    path("auth/change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("", include(router.urls)),
]
