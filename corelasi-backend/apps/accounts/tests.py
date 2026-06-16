from django.conf import settings
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.test import APIClient
from rest_framework.test import APITestCase
from rest_framework import status
from academic.models import Kelas

User = get_user_model()

THROTTLED_REST_FRAMEWORK = {
    **settings.REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {
        **settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"],
        "login": "2/min",
        "password_reset": "1/min",
    },
}

class UserModelTests(TestCase):
    """Unit tests for the custom User model and UserManager."""

    def test_create_user_with_email_successful(self):
        user = User.objects.create_user(
            email="guru@corelasi.test",
            password="password123",
            name="Guru Test",
            role="guru"
        )
        self.assertEqual(user.email, "guru@corelasi.test")
        self.assertTrue(user.check_password("password123"))
        self.assertEqual(user.name, "Guru Test")
        self.assertEqual(user.role, "guru")
        self.assertTrue(user.is_active)
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)

    def test_create_user_no_email_raises_error(self):
        with self.assertRaises(ValueError):
            User.objects.create_user(
                email="",
                password="password123",
                name="No Email"
            )

    def test_create_superuser_successful(self):
        admin = User.objects.create_superuser(
            email="admin@corelasi.test",
            password="adminpassword",
            name="Admin Test"
        )
        self.assertEqual(admin.email, "admin@corelasi.test")
        self.assertTrue(admin.check_password("adminpassword"))
        self.assertEqual(admin.name, "Admin Test")
        self.assertEqual(admin.role, "admin")
        self.assertTrue(admin.is_active)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.is_superuser)


class AuthenticationAPITests(APITestCase):
    """Integration API tests for custom SimpleJWT and Profile endpoints."""

    def setUp(self):
        self.user_password = "password123"
        self.user = User.objects.create_user(
            email="siswa@corelasi.test",
            password=self.user_password,
            name="Siswa Test",
            role="siswa"
        )
        self.login_url = reverse("accounts:login")
        self.profile_url = reverse("accounts:profile")

    def test_login_returns_access_token_and_http_only_refresh_cookie(self):
        response = self.client.post(
            self.login_url,
            {"email": "siswa@corelasi.test", "password": self.user_password},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["message"], "Login berhasil.")
        
        data = response.data["data"]
        self.assertIn("accessToken", data)
        self.assertNotIn("refreshToken", data)
        self.assertIn("user", data)
        refresh_cookie = response.cookies[settings.AUTH_REFRESH_COOKIE_NAME]
        self.assertTrue(refresh_cookie["httponly"])
        self.assertEqual(refresh_cookie["path"], "/api/auth/")
        self.assertEqual(refresh_cookie["samesite"], "Lax")
        
        user_data = data["user"]
        self.assertEqual(user_data["email"], "siswa@corelasi.test")
        self.assertEqual(user_data["name"], "Siswa Test")
        self.assertEqual(user_data["role"], "siswa")

    def test_login_failed_with_invalid_credentials_returns_error_envelope(self):
        response = self.client.post(
            self.login_url,
            {"email": "siswa@corelasi.test", "password": "wrongpassword"},
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "Email atau kata sandi salah.")
        self.assertIn("errors", response.data)

    def test_get_profile_authenticated_successful(self):
        login_res = self.client.post(
            self.login_url,
            {"email": "siswa@corelasi.test", "password": self.user_password},
            format="json"
        )
        access_token = login_res.data["data"]["accessToken"]
        
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")
        response = self.client.get(self.profile_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["email"], "siswa@corelasi.test")
        self.assertEqual(response.data["data"]["name"], "Siswa Test")

    def test_get_profile_unauthenticated_failed(self):
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_rotates_cookie_without_accepting_body_token(self):
        login_response = self.client.post(
            self.login_url,
            {"email": self.user.email, "password": self.user_password},
            format="json",
        )
        original_cookie = login_response.cookies[
            settings.AUTH_REFRESH_COOKIE_NAME
        ].value
        original_jti = RefreshToken(original_cookie)["jti"]

        response = self.client.post(
            reverse("accounts:token_refresh"),
            {"refreshToken": "body-token-must-not-be-used"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("accessToken", response.data["data"])
        self.assertNotIn("refreshToken", response.data["data"])
        rotated_cookie = response.cookies[
            settings.AUTH_REFRESH_COOKIE_NAME
        ].value
        self.assertNotEqual(rotated_cookie, original_cookie)
        self.assertTrue(
            BlacklistedToken.objects.filter(
                token__jti=original_jti
            ).exists()
        )

    def test_logout_blacklists_refresh_token_and_deletes_cookie(self):
        login_response = self.client.post(
            self.login_url,
            {"email": self.user.email, "password": self.user_password},
            format="json",
        )
        refresh_token = login_response.cookies[
            settings.AUTH_REFRESH_COOKIE_NAME
        ].value
        refresh_jti = RefreshToken(refresh_token)["jti"]

        response = self.client.post(reverse("accounts:logout"), format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(
            BlacklistedToken.objects.filter(
                token__jti=refresh_jti
            ).exists()
        )
        deleted_cookie = response.cookies[settings.AUTH_REFRESH_COOKIE_NAME]
        self.assertEqual(deleted_cookie.value, "")
        self.assertEqual(deleted_cookie["max-age"], 0)

    def test_change_password_requires_current_password_and_updates_credentials(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/auth/change-password/",
            {
                "currentPassword": self.user_password,
                "newPassword": "new-secure-password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("new-secure-password"))

    def test_change_password_rejects_incorrect_current_password(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(
            "/api/auth/change-password/",
            {
                "currentPassword": "incorrect-password",
                "newPassword": "new-secure-password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(self.user_password))


@override_settings(
    SHOWCASE_MODE=True,
    SHOWCASE_ACCOUNT_EMAILS=frozenset(
        {
            "admin@corelasi.test",
            "guru@corelasi.test",
            "siswa@corelasi.test",
        }
    ),
)
class ShowcaseAuthenticationTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.demo_admin = User.objects.create_user(
            email="admin@corelasi.test",
            password="SecureDemoPass456!",
            name="Admin Showcase",
            role="admin",
        )
        self.demo_teacher = User.objects.create_user(
            email="guru@corelasi.test",
            password="SecureTeacherPass456!",
            name="Guru Showcase",
            role="guru",
            nip_or_nis="G-001",
        )
        self.demo_student = User.objects.create_user(
            email="siswa@corelasi.test",
            password="SecureStudentPass456!",
            name="Siswa Showcase",
            role="siswa",
            nip_or_nis="S-002",
        )
        self.regular_user = User.objects.create_user(
            email="regular@corelasi.test",
            password="SecureRegularPass456!",
            name="Regular User",
            role="siswa",
            nip_or_nis="S-001",
        )
        self.showcase_url = reverse("accounts:showcase_login")

    def tearDown(self):
        cache.clear()

    def _showcase_login(self, email=None):
        response = self.client.post(
            self.showcase_url,
            {"email": email or self.demo_admin.email},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response

    def test_showcase_login_is_disabled_by_default(self):
        with override_settings(SHOWCASE_MODE=False):
            response = self.client.post(
                self.showcase_url,
                {"email": self.demo_admin.email},
                format="json",
            )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_showcase_login_returns_session_for_allowlisted_account(self):
        response = self._showcase_login()

        self.assertEqual(response.data["data"]["user"]["role"], "admin")
        self.assertIn("accessToken", response.data["data"])
        self.assertNotIn("refreshToken", response.data["data"])
        self.assertIn(settings.AUTH_REFRESH_COOKIE_NAME, response.cookies)

    def test_showcase_login_rejects_non_allowlisted_account(self):
        response = self.client.post(
            self.showcase_url,
            {"email": self.regular_user.email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    def test_showcase_admin_can_delete_other_users(self):
        access_token = self._showcase_login().data["data"]["accessToken"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = self.client.delete(
            reverse("accounts:users-detail", args=[self.regular_user.id])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(User.objects.filter(id=self.regular_user.id).exists())

    def test_showcase_teacher_keeps_normal_non_admin_write_permissions(self):
        access_token = self._showcase_login(self.demo_teacher.email).data["data"]["accessToken"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = self.client.delete(
            reverse("accounts:users-detail", args=[self.regular_user.id])
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(User.objects.filter(id=self.regular_user.id).exists())

    def test_showcase_admin_can_create_users(self):
        access_token = self._showcase_login().data["data"]["accessToken"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = self.client.post(
            reverse("accounts:users-list"),
            {
                "email": "escaped-admin@corelasi.test",
                "password": "ReplacementPass789!",
                "name": "Escaped Admin",
                "role": "admin",
                "status": "aktif",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(
            User.objects.filter(email="escaped-admin@corelasi.test").exists()
        )

    def test_showcase_admin_can_update_users(self):
        access_token = self._showcase_login().data["data"]["accessToken"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = self.client.patch(
            reverse("accounts:users-detail", args=[self.regular_user.id]),
            {"role": "admin", "status": "nonaktif"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.regular_user.refresh_from_db()
        self.assertEqual(self.regular_user.role, "admin")
        self.assertEqual(self.regular_user.status, "nonaktif")

    def test_showcase_admin_can_change_its_password(self):
        access_token = self._showcase_login().data["data"]["accessToken"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = self.client.post(
            reverse("accounts:change_password"),
            {
                "currentPassword": "SecureDemoPass456!",
                "newPassword": "ReplacementPass789!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.demo_admin.refresh_from_db()
        self.assertTrue(self.demo_admin.check_password("ReplacementPass789!"))

    def test_showcase_admin_can_update_user_password(self):
        access_token = self._showcase_login().data["data"]["accessToken"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = self.client.patch(
            reverse("accounts:users-detail", args=[self.regular_user.id]),
            {"password": "ReplacementPass789!"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.regular_user.refresh_from_db()
        self.assertTrue(self.regular_user.check_password("ReplacementPass789!"))

    def test_showcase_admin_can_resolve_password_reset(self):
        from accounts.models import PasswordResetRequest

        reset_request = PasswordResetRequest.objects.create(user=self.regular_user)
        access_token = self._showcase_login().data["data"]["accessToken"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = self.client.patch(
            reverse("accounts:password-reset-requests-resolve", args=[reset_request.id])
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        reset_request.refresh_from_db()
        self.assertEqual(reset_request.status, "resolved")

    def test_showcase_admin_cannot_delete_itself(self):
        access_token = self._showcase_login().data["data"]["accessToken"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = self.client.delete(
            reverse("accounts:users-detail", args=[self.demo_admin.id])
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.demo_admin.refresh_from_db()
        self.assertTrue(User.objects.filter(id=self.demo_admin.id).exists())

    def test_showcase_teacher_can_change_its_password_like_normal_role(self):
        access_token = self._showcase_login(self.demo_teacher.email).data["data"]["accessToken"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = self.client.post(
            reverse("accounts:change_password"),
            {
                "currentPassword": "SecureTeacherPass456!",
                "newPassword": "ReplacementPass789!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.demo_teacher.refresh_from_db()
        self.assertTrue(self.demo_teacher.check_password("ReplacementPass789!"))

    def test_showcase_student_can_change_its_password_like_normal_role(self):
        access_token = self._showcase_login(self.demo_student.email).data["data"]["accessToken"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access_token}")

        response = self.client.post(
            reverse("accounts:change_password"),
            {
                "currentPassword": "SecureStudentPass456!",
                "newPassword": "ReplacementPass789!",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.demo_student.refresh_from_db()
        self.assertTrue(self.demo_student.check_password("ReplacementPass789!"))


class AuthenticationCsrfTests(APITestCase):
    def setUp(self):
        self.client = APIClient(enforce_csrf_checks=True)
        self.password = "SecureCsrfPass456!"
        self.user = User.objects.create_user(
            email="csrf@corelasi.test",
            password=self.password,
            name="CSRF Test",
            role="siswa",
        )

    def _csrf_token(self):
        response = self.client.get(reverse("accounts:csrf"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        return response.cookies["csrftoken"].value

    def test_login_rejects_missing_csrf_token(self):
        response = self.client.post(
            reverse("accounts:login"),
            {"email": self.user.email, "password": self.password},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    @override_settings(
        SHOWCASE_MODE=True,
        SHOWCASE_ACCOUNT_EMAILS=frozenset({"csrf@corelasi.test"}),
    )
    def test_showcase_login_rejects_missing_csrf_token(self):
        response = self.client.post(
            reverse("accounts:showcase_login"),
            {"email": self.user.email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_cookie_auth_flow_accepts_valid_csrf_header(self):
        csrf_token = self._csrf_token()
        login_response = self.client.post(
            reverse("accounts:login"),
            {"email": self.user.email, "password": self.password},
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)

        refresh_response = self.client.post(
            reverse("accounts:token_refresh"),
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)

        logout_response = self.client.post(
            reverse("accounts:logout"),
            format="json",
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        self.assertEqual(logout_response.status_code, status.HTTP_200_OK)

@override_settings(REST_FRAMEWORK=THROTTLED_REST_FRAMEWORK)
class AuthenticationThrottleTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.user = User.objects.create_user(
            email="throttle@corelasi.test",
            password="SecureThrottlePass456!",
            name="Throttle Test",
            role="siswa",
        )

    def tearDown(self):
        cache.clear()

    def test_login_is_throttled_by_client_ip(self):
        for _ in range(2):
            response = self.client.post(
                reverse("accounts:login"),
                {
                    "email": self.user.email,
                    "password": "incorrect-password",
                },
                format="json",
            )
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        response = self.client.post(
            reverse("accounts:login"),
            {
                "email": self.user.email,
                "password": "incorrect-password",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

    def test_password_reset_request_is_throttled(self):
        url = "/api/users/password-reset-requests/"
        response = self.client.post(
            url,
            {"email": self.user.email},
            format="json",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        response = self.client.post(
            url,
            {"email": self.user.email},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)


class UserManagementAPITests(APITestCase):
    """Integration API tests for User CRUD and Password Reset Flow."""

    def setUp(self):
        cache.clear()
        self.admin = User.objects.create_superuser(
            email="admin@corelasi.test",
            password="adminpassword",
            name="Admin Test"
        )
        self.teacher = User.objects.create_user(
            email="guru@corelasi.test",
            password="gurupassword",
            name="Guru Test",
            role="guru",
            is_pengampu=True,
            is_piket_today=True
        )
        self.siswa = User.objects.create_user(
            email="siswa@corelasi.test",
            password="siswapassword",
            name="Siswa Test",
            role="siswa"
        )
        self.kelas = Kelas.objects.create(name="XI-A", tingkat="XI", wali_kelas=self.teacher)

        # URLs
        self.users_url = "/api/users/"
        self.reset_requests_url = "/api/users/password-reset-requests/"

    def tearDown(self):
        cache.clear()

    def test_admin_can_list_users(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(len(response.data["data"]), 3) # admin, teacher, siswa

    def test_non_admin_can_read_but_not_write(self):
        self.client.force_authenticate(user=self.teacher)
        
        # Read is allowed
        response = self.client.get(self.users_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Create is forbidden
        response = self.client.post(self.users_url, {"name": "New User", "email": "new@corelasi.test", "role": "siswa"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_user_list_is_scoped_to_self(self):
        self.client.force_authenticate(user=self.siswa)
        response = self.client.get(self.users_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([row["id"] for row in response.data["data"]], [self.siswa.id])

    def test_teacher_user_list_is_scoped_to_accessible_students_and_self(self):
        self.siswa.kelas = self.kelas
        self.siswa.save(update_fields=["kelas"])
        unrelated_class = Kelas.objects.create(name="XII-C", tingkat="XII")
        unrelated_student = User.objects.create_user(
            email="unrelated@corelasi.test",
            password="password123",
            name="Unrelated Student",
            role="siswa",
            nip_or_nis="99999",
            kelas=unrelated_class,
        )

        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.users_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_ids = {row["id"] for row in response.data["data"]}
        self.assertIn(self.teacher.id, returned_ids)
        self.assertIn(self.siswa.id, returned_ids)
        self.assertNotIn(unrelated_student.id, returned_ids)

    def test_admin_create_student_successful(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Siswa Baru",
            "email": "siswabaru@corelasi.test",
            "password": "SecureStudentPass456!",
            "role": "siswa",
            "status": "aktif",
            "nipOrNis": "12345678",
            "gender": "L",
            "phoneNumber": "0811223344",
            "angkatan": 1
        }
        response = self.client.post(self.users_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["name"], "Siswa Baru")
        self.assertEqual(response.data["data"]["angkatan"], 1)
        self.assertIsNone(response.data["data"]["kelasId"])

    def test_admin_create_user_requires_a_password(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Siswa Tanpa Password",
            "email": "tanpapassword@corelasi.test",
            "role": "siswa",
            "status": "aktif",
            "nipOrNis": "12345679",
            "gender": "L",
            "angkatan": 1,
        }

        response = self.client.post(self.users_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data["errors"])
        self.assertFalse(User.objects.filter(email=payload["email"]).exists())

    def test_admin_create_user_rejects_a_common_password(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Siswa Password Lemah",
            "email": "passwordlemah@corelasi.test",
            "password": "password123",
            "role": "siswa",
            "status": "aktif",
            "nipOrNis": "12345680",
            "gender": "L",
            "angkatan": 1,
        }

        response = self.client.post(self.users_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data["errors"])
        self.assertFalse(User.objects.filter(email=payload["email"]).exists())

    def test_admin_create_teacher_successful(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Guru Baru",
            "email": "gurubaru@corelasi.test",
            "password": "SecureTeacherPass456!",
            "role": "guru",
            "status": "aktif",
            "nipOrNis": "987654321",
            "gender": "P"
        }
        response = self.client.post(self.users_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        data = response.data["data"]
        self.assertEqual(data["assignments"]["isPengampu"], False)
        # Check dynamic wali kelas resolution: not wali kelas yet
        self.assertEqual(data["assignments"]["isWaliKelas"], False)

    def test_wali_kelas_resolution_filtered_by_active_tahun_ajaran(self):
        from academic.models import TahunAjaran, Kelas
        
        # Create active and inactive academic years
        ta_active = TahunAjaran.objects.create(
            name="2025/2026",
            status="aktif",
            tanggal_mulai="2025-07-01",
            tanggal_selesai="2026-06-30"
        )
        ta_inactive = TahunAjaran.objects.create(
            name="2024/2025",
            status="nonaktif",
            tanggal_mulai="2024-07-01",
            tanggal_selesai="2025-06-30"
        )
        
        # Create class under inactive academic year where teacher is wali kelas
        Kelas.objects.create(
            name="X-Old",
            tingkat="X",
            wali_kelas=self.teacher,
            tahun_ajaran=ta_inactive
        )
        
        # Admin requests teacher details
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f"{self.users_url}{self.teacher.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Since the class is in an inactive year and teacher has no classes in the active year,
        # isWaliKelas must be False and waliKelasName must be None
        data = response.data["data"]
        self.assertEqual(data["assignments"]["isWaliKelas"], False)
        self.assertIsNone(data["assignments"]["waliKelasName"])
        
        # Now create a class under the active academic year where teacher is wali kelas
        class_active = Kelas.objects.create(
            name="X-Active",
            tingkat="X",
            wali_kelas=self.teacher,
            tahun_ajaran=ta_active
        )
        
        response2 = self.client.get(f"{self.users_url}{self.teacher.id}/")
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        # Under active year, teacher is wali kelas of "X-Active"
        data2 = response2.data["data"]
        self.assertEqual(data2["assignments"]["isWaliKelas"], True)
        self.assertEqual(data2["assignments"]["waliKelasName"], "X-Active")
        self.assertEqual(data2["assignments"]["waliKelasId"], class_active.id)

    def test_password_reset_flow_complete(self):
        # 1. Anonymous user submits password reset request
        response = self.client.post(self.reset_requests_url, {"email": "siswa@corelasi.test"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])

        # Check in DB
        from accounts.models import PasswordResetRequest
        reset_req = PasswordResetRequest.objects.get(user__email="siswa@corelasi.test")
        self.assertEqual(reset_req.status, "pending")

        # 2. Resubmitting raises error
        response = self.client.post(self.reset_requests_url, {"email": "siswa@corelasi.test"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertIn("Permintaan atur ulang kata sandi Anda sebelumnya masih dalam antrean proses Admin.", response.data["message"])

        # 3. Non-admin cannot resolve the request
        self.client.force_authenticate(user=self.siswa)
        resolve_url = f"{self.reset_requests_url}{reset_req.id}/resolve/"
        response = self.client.patch(resolve_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 4. Admin resolves request and generates temporary password
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(resolve_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        
        temp_pwd = response.data["data"]["tempPassword"]
        self.assertTrue(temp_pwd.startswith("pwd-"))

        # Verify status is resolved
        reset_req.refresh_from_db()
        self.assertEqual(reset_req.status, "resolved")

        # 5. User can login with the temporary password
        self.client.logout()
        login_response = self.client.post(
            reverse("accounts:login"),
            {"email": "siswa@corelasi.test", "password": temp_pwd},
            format="json"
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertTrue(login_response.data["success"])
