from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from academic.models import TahunAjaran, Semester, Kelas, MataPelajaran

User = get_user_model()

class AcademicAPITests(APITestCase):
    """Test suite for CORELASI Academic Core APIs and Role-Based Access Controls."""

    def setUp(self):
        # Create users for role-based permission verification
        self.admin = User.objects.create_user(
            email="admin@corelasi.test",
            password="password123",
            name="Admin User",
            role="admin"
        )
        self.teacher = User.objects.create_user(
            email="guru@corelasi.test",
            password="password123",
            name="Guru User",
            role="guru"
        )
        self.student = User.objects.create_user(
            email="siswa@corelasi.test",
            password="password123",
            name="Siswa User",
            role="siswa"
        )

        # Create basic instances
        self.ta = TahunAjaran.objects.create(
            name="2025/2026",
            status="aktif",
            tanggal_mulai="2025-07-01",
            tanggal_selesai="2026-06-30"
        )
        self.semester = Semester.objects.create(
            name="Ganjil",
            tahun_ajaran=self.ta,
            status="aktif",
            tanggal_mulai="2025-07-01",
            tanggal_selesai="2025-12-31"
        )
        self.kelas = Kelas.objects.create(
            name="X-A",
            tingkat="X",
            wali_kelas=self.teacher
        )
        self.mapel = MataPelajaran.objects.create(
            name="Matematika",
            kode="MTK"
        )

        # URL endpoints
        self.ta_list_url = reverse("academic:tahun-ajaran-list")
        self.ta_detail_url = reverse("academic:tahun-ajaran-detail", args=[self.ta.id])
        self.sem_list_url = reverse("academic:semester-list")
        self.kelas_list_url = reverse("academic:kelas-list")
        self.mapel_list_url = reverse("academic:mapel-list")

    # ─── Permission Check ────────────────────────────────────────────────────────
    
    def test_unauthenticated_requests_are_denied(self):
        response = self.client.get(self.ta_list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_read_operations_allowed_for_all_authenticated_roles(self):
        for user in [self.admin, self.teacher, self.student]:
            self.client.force_authenticate(user=user)
            response = self.client.get(self.ta_list_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(response.data["success"])

    def test_write_operations_denied_for_teacher_and_student(self):
        payload = {"name": "2026/2027", "status": "aktif", "tanggalMulai": "2026-07-01", "tanggalSelesai": "2027-06-30"}
        for user in [self.teacher, self.student]:
            self.client.force_authenticate(user=user)
            
            # Test Create (POST)
            post_response = self.client.post(self.ta_list_url, payload, format="json")
            self.assertEqual(post_response.status_code, status.HTTP_403_FORBIDDEN)
            
            # Test Delete (DELETE)
            delete_response = self.client.delete(self.ta_detail_url)
            self.assertEqual(delete_response.status_code, status.HTTP_403_FORBIDDEN)

    # ─── Tahun Ajaran CRUD ───────────────────────────────────────────────────────
    
    def test_admin_can_create_tahun_ajaran(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "2026/2027",
            "status": "aktif",
            "tanggalMulai": "2026-07-01",
            "tanggalSelesai": "2027-06-30"
        }
        response = self.client.post(self.ta_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"]["name"], "2026/2027")

    def test_only_one_tahun_ajaran_active(self):
        # Create second academic year as active
        ta2 = TahunAjaran.objects.create(
            name="2026/2027",
            status="aktif",
            tanggal_mulai="2026-07-01",
            tanggal_selesai="2027-06-30"
        )
        # Check first academic year (self.ta) was automatically set to nonaktif
        self.ta.refresh_from_db()
        self.assertEqual(self.ta.status, "nonaktif")
        self.assertEqual(ta2.status, "aktif")

    # ─── Semester CRUD & Year Name Binding ───────────────────────────────────────
    
    def test_admin_can_create_semester_with_name_binding(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Genap",
            "tahunAjaran": "2025/2026",  # Passed as name, resolved by serializer
            "status": "nonaktif",
            "tanggalMulai": "2026-01-02",
            "tanggalSelesai": "2026-06-30"
        }
        response = self.client.post(self.sem_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["tahunAjaran"], "2025/2026")
        self.assertEqual(response.data["data"]["name"], "Genap")

    def test_create_semester_with_invalid_year_fails(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Genap",
            "tahunAjaran": "InvalidYearName",
            "status": "nonaktif"
        }
        response = self.client.post(self.sem_url_list if hasattr(self, 'sem_url_list') else self.sem_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])

    # ─── Kelas CRUD & Wali Kelas Resolving ───────────────────────────────────────
    
    def test_admin_can_create_kelas_with_wali_kelas(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "XI-B",
            "tingkat": "XI",
            "waliKelasId": self.teacher.id
        }
        response = self.client.post(self.kelas_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["waliKelasName"], self.teacher.name)

    def test_duplicate_kelas_name_different_ta_allowed(self):
        self.client.force_authenticate(user=self.admin)
        # Setup another TahunAjaran
        ta2 = TahunAjaran.objects.create(
            name="2026/2027",
            status="nonaktif",
            tanggal_mulai="2026-07-01",
            tanggal_selesai="2027-06-30"
        )
        # Create XI-A in self.ta (first one was X-A, let's create X-A in ta2)
        payload = {
            "name": "X-A",
            "tingkat": "X",
            "tahunAjaran": "2026/2027"
        }
        response = self.client.post(self.kelas_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["tahunAjaran"], "2026/2027")

    def test_duplicate_kelas_name_same_ta_denied(self):
        self.client.force_authenticate(user=self.admin)
        # Create X-A in the same TahunAjaran (X-A already exists in self.ta)
        payload = {
            "name": "X-A",
            "tingkat": "X",
            "tahunAjaran": "2025/2026"
        }
        response = self.client.post(self.kelas_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ─── Mata Pelajaran CRUD ─────────────────────────────────────────────────────
    
    def test_admin_cannot_duplicate_mapel_kode(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Matematika Lanjut",
            "kode": "MTK"  # Same as setup MTK
        }
        response = self.client.post(self.mapel_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_semester_only_one_active(self):
        # Create second semester as active
        semester2 = Semester.objects.create(
            name="Genap",
            tahun_ajaran=self.ta,
            status="aktif",
            tanggal_mulai="2026-01-01",
            tanggal_selesai="2026-06-30"
        )
        # Check first semester was automatically set to nonaktif
        self.semester.refresh_from_db()
        self.assertEqual(self.semester.status, "nonaktif")
        self.assertEqual(semester2.status, "aktif")

    def test_semester_date_out_of_bounds_fails(self):
        self.client.force_authenticate(user=self.admin)
        # Semester start before TahunAjaran start
        payload = {
            "name": "Genap",
            "tahunAjaran": "2025/2026",
            "status": "nonaktif",
            "tanggalMulai": "2025-06-01",  # Year starts on 2025-07-01
            "tanggalSelesai": "2025-12-31"
        }
        response = self.client.post(self.sem_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_semester_overlap_fails(self):
        self.client.force_authenticate(user=self.admin)
        # Overlap with self.semester (Ganjil: 2025-07-01 s.d. 2025-12-31)
        payload = {
            "name": "Genap",
            "tahunAjaran": "2025/2026",
            "status": "nonaktif",
            "tanggalMulai": "2025-12-01",  # Overlaps!
            "tanggalSelesai": "2026-05-30"
        }
        response = self.client.post(self.sem_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_mapel_auto_fill_kode(self):
        self.client.force_authenticate(user=self.admin)
        payload = {
            "name": "Bahasa Indonesia",
            "kode": ""  # Should auto-fill
        }
        response = self.client.post(self.mapel_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["kode"], "MAPEL-BI")
