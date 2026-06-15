from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from academic.models import TahunAjaran, Semester, Kelas, MataPelajaran
from schedules.models import JadwalPelajaran, JadwalPiket

User = get_user_model()


class ScheduleAPITests(APITestCase):
    """Integration API tests for Schedules app (JadwalPelajaran & JadwalPiket)."""

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
        self.teacher_other = User.objects.create_user(
            email="guru2@corelasi.test",
            password="guru2password",
            name="Guru Other Test",
            role="guru"
        )
        self.siswa = User.objects.create_user(
            email="siswa@corelasi.test",
            password="siswapassword",
            name="Siswa Test",
            role="siswa"
        )

        # 2. Academic Core Objects
        self.tahun_ajaran = TahunAjaran.objects.create(
            name="2025/2026",
            status="aktif",
            tanggal_mulai="2025-07-01",
            tanggal_selesai="2026-06-30"
        )
        self.semester = Semester.objects.create(
            name="Ganjil",
            tahun_ajaran=self.tahun_ajaran,
            status="aktif",
            tanggal_mulai="2025-07-01",
            tanggal_selesai="2025-12-31"
        )
        self.kelas = Kelas.objects.create(
            name="XI-A",
            tingkat="XI",
            wali_kelas=self.teacher
        )
        self.siswa.kelas = self.kelas
        self.siswa.save()
        self.kelas_other = Kelas.objects.create(
            name="XI-B",
            tingkat="XI",
            wali_kelas=self.teacher_other
        )
        self.mapel_math = MataPelajaran.objects.create(
            name="Matematika",
            kode="MP-MATH"
        )
        self.mapel_physics = MataPelajaran.objects.create(
            name="Fisika",
            kode="MP-PHYS"
        )

        # URLs
        self.pembelajaran_list_url = "/api/schedules/pembelajaran/"
        self.piket_list_url = "/api/schedules/piket/"

    def test_authenticated_user_can_read_schedules(self):
        # Authenticate as student
        self.client.force_authenticate(user=self.siswa)
        
        response = self.client.get(self.pembelajaran_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        response = self.client.get(self.piket_list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertEqual(response.data["data"], [])

    def test_teacher_only_sees_own_learning_and_duty_schedules(self):
        own_schedule = JadwalPelajaran.objects.create(
            kelas=self.kelas,
            mapel=self.mapel_math,
            guru=self.teacher,
            hari="Senin",
            waktu_mulai="07:30",
            waktu_selesai="09:00",
            semester=self.semester,
        )
        JadwalPelajaran.objects.create(
            kelas=self.kelas_other,
            mapel=self.mapel_physics,
            guru=self.teacher_other,
            hari="Selasa",
            waktu_mulai="09:15",
            waktu_selesai="10:45",
            semester=self.semester,
        )
        own_duty = JadwalPiket.objects.create(
            guru=self.teacher,
            hari="Rabu",
            semester=self.semester,
        )
        JadwalPiket.objects.create(
            guru=self.teacher_other,
            hari="Kamis",
            semester=self.semester,
        )

        self.client.force_authenticate(user=self.teacher)
        learning_response = self.client.get(self.pembelajaran_list_url)
        duty_response = self.client.get(self.piket_list_url)

        self.assertEqual(
            [row["id"] for row in learning_response.data["data"]],
            [own_schedule.id],
        )
        self.assertEqual(
            [row["id"] for row in duty_response.data["data"]],
            [own_duty.id],
        )

    def test_non_admin_cannot_write_schedules(self):
        self.client.force_authenticate(user=self.teacher)
        
        payload = {
            "kelasId": self.kelas.id,
            "mapelId": self.mapel_math.id,
            "guruId": self.teacher.id,
            "hari": "Senin",
            "waktuMulai": "07:30",
            "waktuSelesai": "09:00",
            "semesterId": self.semester.id
        }
        
        response = self.client.post(self.pembelajaran_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        response = self.client.post(
            self.piket_list_url, 
            {"guruId": self.teacher.id, "hari": "Senin", "semesterId": self.semester.id}, 
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_create_and_delete_learning_schedule(self):
        self.client.force_authenticate(user=self.admin)
        
        payload = {
            "kelasId": self.kelas.id,
            "mapelId": self.mapel_math.id,
            "guruId": self.teacher.id,
            "hari": "Senin",
            "waktuMulai": "07:30",
            "waktuSelesai": "09:00",
            "semesterId": self.semester.id
        }
        
        # Create
        response = self.client.post(self.pembelajaran_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        schedule_id = response.data["data"]["id"]

        # Delete
        delete_url = f"{self.pembelajaran_list_url}{schedule_id}/"
        response = self.client.delete(delete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

    def test_classroom_overlap_conflict_validation(self):
        self.client.force_authenticate(user=self.admin)
        
        # 1. Create initial schedule
        payload_1 = {
            "kelasId": self.kelas.id,
            "mapelId": self.mapel_math.id,
            "guruId": self.teacher.id,
            "hari": "Senin",
            "waktuMulai": "08:00",
            "waktuSelesai": "09:30",
            "semesterId": self.semester.id
        }
        self.client.post(self.pembelajaran_list_url, payload_1, format="json")

        # 2. Try to schedule another class at overlapping time (09:00 - 10:30 overlaps with 08:00 - 09:30)
        payload_overlap = {
            "kelasId": self.kelas.id,
            "mapelId": self.mapel_physics.id,
            "guruId": self.teacher_other.id,
            "hari": "Senin",
            "waktuMulai": "09:00",
            "waktuSelesai": "10:30",
            "semesterId": self.semester.id
        }
        response = self.client.post(self.pembelajaran_list_url, payload_overlap, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(
            response.data["message"], 
            "Kelas tersebut sudah memiliki jadwal pelajaran lain pada waktu yang bersamaan."
        )

    def test_teacher_overlap_conflict_validation(self):
        self.client.force_authenticate(user=self.admin)
        
        # 1. Create initial schedule for class XI-A
        payload_1 = {
            "kelasId": self.kelas.id,
            "mapelId": self.mapel_math.id,
            "guruId": self.teacher.id,
            "hari": "Senin",
            "waktuMulai": "08:00",
            "waktuSelesai": "09:30",
            "semesterId": self.semester.id
        }
        self.client.post(self.pembelajaran_list_url, payload_1, format="json")

        # 2. Try to schedule same teacher for class XI-B at overlapping time (07:30 - 09:00 overlaps with 08:00 - 09:30)
        payload_overlap = {
            "kelasId": self.kelas_other.id,
            "mapelId": self.mapel_physics.id,
            "guruId": self.teacher.id,
            "hari": "Senin",
            "waktuMulai": "07:30",
            "waktuSelesai": "09:00",
            "semesterId": self.semester.id
        }
        response = self.client.post(self.pembelajaran_list_url, payload_overlap, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(
            response.data["message"], 
            "Guru tersebut sudah memiliki jadwal mengajar lain pada waktu yang bersamaan."
        )

    def test_teacher_piket_duplication_validation(self):
        self.client.force_authenticate(user=self.admin)
        
        # 1. Add teacher to Piket on Monday
        payload_1 = {
            "guruId": self.teacher.id,
            "hari": "Senin",
            "semesterId": self.semester.id
        }
        self.client.post(self.piket_list_url, payload_1, format="json")

        # 2. Try adding the same teacher to Piket on Monday again
        response = self.client.post(self.piket_list_url, payload_1, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(
            response.data["message"], 
            "Guru tersebut sudah dijadwalkan piket pada hari yang sama di semester terpilih."
        )
