import datetime
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from academic.models import Kelas, MataPelajaran
from attendance.models import AbsensiSiswa
from learning.models import Tugas, Submission
from journals.models import JurnalPertemuan

User = get_user_model()

class ReportAPITests(APITestCase):
    """Integration API tests for the Reports app."""

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
        self.mapel = MataPelajaran.objects.create(name="Fisika", kode="MP-PHYS")

        # Assign student to kelas
        self.siswa.kelas = self.kelas
        self.siswa.save()

        # URLs
        self.attendance_report_url = "/api/reports/attendance/"
        self.grades_report_url = "/api/reports/grades/"
        self.operational_report_url = "/api/reports/operational/"

    def test_student_cannot_access_reports(self):
        self.client.force_authenticate(user=self.siswa)
        
        response = self.client.get(self.attendance_report_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        response = self.client.get(self.grades_report_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        response = self.client.get(self.operational_report_url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_can_access_attendance_report(self):
        # Create some attendance records
        AbsensiSiswa.objects.create(
            siswa=self.siswa,
            kelas=self.kelas,
            tanggal="2026-06-08",
            status="Hadir"
        )
        AbsensiSiswa.objects.create(
            siswa=self.siswa,
            kelas=self.kelas,
            tanggal="2026-06-09",
            status="Alpa"
        )

        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.attendance_report_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        
        data = response.data["data"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["siswaName"], "Siswa Test")
        self.assertEqual(data[0]["hadir"], 1)
        self.assertEqual(data[0]["alpa"], 1)
        self.assertEqual(data[0]["percentage"], 50) # 1 hadir, 1 alpa -> 50%

    def test_teacher_can_access_grades_report(self):
        # Create a published assignment
        tugas = Tugas.objects.create(
            title="Tugas Termodinamika",
            description="Kerjakan bab 4",
            due_date=datetime.date.today() + datetime.timedelta(days=1),
            kelas=self.kelas,
            mapel=self.mapel,
            guru=self.teacher,
            status="Dipublikasikan"
        )
        # Create graded submission
        Submission.objects.create(
            tugas=tugas,
            siswa=self.siswa,
            grade=90,
            status="Terkumpul"
        )

        self.client.force_authenticate(user=self.teacher)
        response = self.client.get(self.grades_report_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data["data"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["average"], 90)
        self.assertEqual(len(data[0]["grades"]), 1)
        self.assertEqual(data[0]["grades"][0]["score"], 90)

    def test_operational_report_metrics(self):
        # Create sample data
        JurnalPertemuan.objects.create(
            date="2026-06-08",
            kelas=self.kelas,
            mapel=self.mapel,
            guru=self.teacher,
            agenda="KBM 1",
            material_summary="Summary...",
            present_count=30,
            absent_count=0
        )

        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.operational_report_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data["data"]
        self.assertEqual(data["totalSiswa"], 1)
        self.assertEqual(data["totalGuru"], 1)
        self.assertEqual(data["totalKelas"], 1)
        self.assertEqual(data["attendanceRate"], 0.0)
        self.assertEqual(data["journalCompletionRate"], min(100.0, round((1 / 15) * 100, 1)))

    def test_teacher_reports_are_scoped_and_operational_report_is_admin_only(self):
        unrelated_class = Kelas.objects.create(name="XII-C", tingkat="XII")
        unrelated_student = User.objects.create_user(
            email="other-student@corelasi.test",
            password="password123",
            name="Other Student",
            role="siswa",
            kelas=unrelated_class,
        )
        AbsensiSiswa.objects.create(
            siswa=unrelated_student,
            kelas=unrelated_class,
            tanggal="2026-06-08",
            status="Hadir",
        )
        self.client.force_authenticate(user=self.teacher)

        attendance_response = self.client.get(self.attendance_report_url)
        operational_response = self.client.get(self.operational_report_url)

        returned_ids = {row["siswaId"] for row in attendance_response.data["data"]}
        self.assertIn(self.siswa.id, returned_ids)
        self.assertNotIn(unrelated_student.id, returned_ids)
        self.assertEqual(operational_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_empty_reports_do_not_fabricate_attendance_or_grades(self):
        self.client.force_authenticate(user=self.admin)

        attendance_response = self.client.get(self.attendance_report_url)
        grades_response = self.client.get(self.grades_report_url)

        self.assertEqual(attendance_response.data["data"][0]["hadir"], 0)
        self.assertEqual(attendance_response.data["data"][0]["percentage"], 0)
        self.assertEqual(grades_response.data["data"][0]["average"], 0)
