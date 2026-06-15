from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from academic.models import Kelas, MataPelajaran, Semester, TahunAjaran
from journals.models import JurnalPertemuan
from schedules.models import JadwalPelajaran

User = get_user_model()

class JournalAPITests(APITestCase):
    """Integration API tests for the Journals app (JurnalPertemuan)."""

    def setUp(self):
        # 1. Users
        self.admin = User.objects.create_superuser(
            email="admin@corelasi.test",
            password="adminpassword",
            name="Admin Test"
        )
        self.teacher = User.objects.create_user(
            email="guru@corelasi.test",
            password="gurupassword",
            name="Guru Test",
            role="guru"
        )
        self.siswa = User.objects.create_user(
            email="siswa@corelasi.test",
            password="siswapassword",
            name="Siswa Test",
            role="siswa"
        )

        # 2. Academic Objects
        self.kelas = Kelas.objects.create(name="XI-A", tingkat="XI", wali_kelas=self.teacher)
        self.kelas_other = Kelas.objects.create(name="XI-B", tingkat="XI")
        self.mapel = MataPelajaran.objects.create(name="Fisika", kode="MP-PHYS")
        self.mapel_other = MataPelajaran.objects.create(
            name="Kimia", kode="MP-CHEM"
        )
        tahun_ajaran = TahunAjaran.objects.create(
            name="2025/2026",
            status="aktif",
            tanggal_mulai="2025-07-01",
            tanggal_selesai="2026-06-30",
        )
        semester = Semester.objects.create(
            name="Genap",
            tahun_ajaran=tahun_ajaran,
            status="aktif",
        )
        JadwalPelajaran.objects.create(
            kelas=self.kelas,
            mapel=self.mapel,
            guru=self.teacher,
            hari="Senin",
            waktu_mulai="08:00",
            waktu_selesai="09:30",
            semester=semester,
        )

        # Assign student to kelas
        self.siswa.kelas = self.kelas
        self.siswa.save()

        # URLs
        self.journals_url = "/api/journals/"

    def test_teacher_can_crud_journals(self):
        self.client.force_authenticate(user=self.teacher)

        # 1. Create Journal
        payload = {
            "date": "2026-06-08",
            "kelasId": self.kelas.id,
            "mapelId": self.mapel.id,
            "agenda": "Termodinamika Dasar",
            "materialSummary": "Penjelasan hukum ke-0 dan hukum ke-1 termodinamika.",
            "presentCount": 30,
            "absentCount": 2,
            "notes": "Pertemuan berjalan kondusif."
        }
        response = self.client.post(self.journals_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        journal_id = response.data["data"]["id"]

        # 2. Retrieve Journal
        response = self.client.get(f"{self.journals_url}{journal_id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["agenda"], "Termodinamika Dasar")
        self.assertEqual(response.data["data"]["guruName"], "Guru Test")

        # 3. Update Journal
        response = self.client.patch(f"{self.journals_url}{journal_id}/", {"agenda": "Termodinamika Update"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(JurnalPertemuan.objects.get(id=journal_id).agenda, "Termodinamika Update")

        # 4. Delete Journal
        response = self.client.delete(f"{self.journals_url}{journal_id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(JurnalPertemuan.objects.filter(id=journal_id).count(), 0)

    def test_student_cannot_access_journals(self):
        # Create a journal entry
        journal = JurnalPertemuan.objects.create(
            date="2026-06-08",
            kelas=self.kelas,
            mapel=self.mapel,
            guru=self.teacher,
            agenda="Sistem Persamaan Linier",
            material_summary="Pengenalan metode eliminasi.",
            present_count=30,
            absent_count=0
        )

        self.client.force_authenticate(user=self.siswa)

        # 1. Student cannot write (POST)
        payload = {
            "date": "2026-06-08",
            "kelasId": self.kelas.id,
            "mapelId": self.mapel.id,
            "agenda": "Mencoba menulis",
            "materialSummary": "Summary...",
            "presentCount": 30,
            "absentCount": 0
        }
        response = self.client.post(self.journals_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Journals are an internal Admin/Guru surface.
        response = self.client.get(self.journals_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.get(f"{self.journals_url}{journal.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_journal_filters(self):
        # Create journal 1
        j1 = JurnalPertemuan.objects.create(
            date="2026-06-08",
            kelas=self.kelas,
            mapel=self.mapel,
            guru=self.teacher,
            agenda="Agenda A",
            material_summary="Summary A",
            present_count=30,
            absent_count=0
        )
        # Create journal 2 (different class)
        j2 = JurnalPertemuan.objects.create(
            date="2026-06-08",
            kelas=self.kelas_other,
            mapel=self.mapel,
            guru=self.admin, # different guru
            agenda="Agenda B",
            material_summary="Summary B",
            present_count=20,
            absent_count=1
        )

        self.client.force_authenticate(user=self.admin)

        # Filter by kelasId
        response = self.client.get(self.journals_url, {"kelasId": self.kelas.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["agenda"], "Agenda A")

        # Filter by guruId
        response = self.client.get(self.journals_url, {"guruId": self.admin.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["data"]), 1)
        self.assertEqual(response.data["data"][0]["agenda"], "Agenda B")

    def test_teacher_cannot_create_journal_for_unrelated_class(self):
        self.client.force_authenticate(user=self.teacher)
        response = self.client.post(
            self.journals_url,
            {
                "date": "2026-06-08",
                "kelasId": self.kelas_other.id,
                "mapelId": self.mapel.id,
                "agenda": "Kelas di luar kewenangan",
                "materialSummary": "Tidak boleh tersimpan.",
                "presentCount": 20,
                "absentCount": 0,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_cannot_create_or_move_journal_to_unassigned_subject(self):
        journal = JurnalPertemuan.objects.create(
            date="2026-06-08",
            kelas=self.kelas,
            mapel=self.mapel,
            guru=self.teacher,
            agenda="Fisika",
            material_summary="Materi valid",
            present_count=1,
            absent_count=0,
        )
        self.client.force_authenticate(user=self.teacher)

        create_response = self.client.post(
            self.journals_url,
            {
                "date": "2026-06-08",
                "kelasId": self.kelas.id,
                "mapelId": self.mapel_other.id,
                "agenda": "Kimia",
                "materialSummary": "Mapel tidak diampu.",
                "presentCount": 1,
                "absentCount": 0,
            },
            format="json",
        )
        update_response = self.client.patch(
            f"{self.journals_url}{journal.id}/",
            {"mapelId": self.mapel_other.id},
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)
