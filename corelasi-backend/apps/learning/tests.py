import datetime
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework import status

from academic.models import Kelas, MataPelajaran, Semester, TahunAjaran
from learning.models import Materi, Tugas, Submission
from schedules.models import JadwalPelajaran

User = get_user_model()

THROTTLED_REST_FRAMEWORK = {
    **settings.REST_FRAMEWORK,
    "DEFAULT_THROTTLE_RATES": {
        **settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"],
        "upload": "1/min",
    },
}


class LearningAPITests(APITestCase):
    """Integration API tests for the Learning app (Materi, Tugas, Submission, and File Upload)."""

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
            role="guru",
        )
        self.siswa = User.objects.create_user(
            email="siswa@corelasi.test",
            password="siswapassword",
            name="Siswa Test",
            role="siswa"
        )
        self.siswa_other = User.objects.create_user(
            email="siswa2@corelasi.test",
            password="siswa2password",
            name="Siswa Other Test",
            role="siswa"
        )

        # 2. Academic Objects
        self.kelas_a = Kelas.objects.create(name="XI-A", tingkat="XI", wali_kelas=self.teacher)
        self.kelas_b = Kelas.objects.create(name="XI-B", tingkat="XI")
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
            kelas=self.kelas_a,
            mapel=self.mapel,
            guru=self.teacher,
            hari="Senin",
            waktu_mulai="08:00",
            waktu_selesai="09:30",
            semester=semester,
        )

        # Assign siswa to kelas_a
        self.siswa.kelas = self.kelas_a
        self.siswa.save()

        # URLs
        self.materi_url = "/api/learning/materi/"
        self.tugas_url = "/api/learning/tugas/"
        self.submissions_url = "/api/learning/submissions/"
        self.upload_url = "/api/learning/upload/"

    def test_teacher_can_crud_materi(self):
        self.client.force_authenticate(user=self.teacher)

        # Create
        payload = {
            "title": "Materi Kinetika",
            "description": "Pengenalan kinetika partikel",
            "sourceType": "link",
            "fileUrl": "https://example.com/kinetika.pdf",
            "kelasId": self.kelas_a.id,
            "mapelId": self.mapel.id,
            "status": "Dipublikasikan"
        }
        response = self.client.post(self.materi_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        materi_id = response.data["data"]["id"]

        # Read
        response = self.client.get(f"{self.materi_url}{materi_id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["title"], "Materi Kinetika")

        # Update
        response = self.client.patch(f"{self.materi_url}{materi_id}/", {"title": "Kinetika Update"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Materi.objects.get(id=materi_id).title, "Kinetika Update")

        # Delete
        response = self.client.delete(f"{self.materi_url}{materi_id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Materi.objects.filter(id=materi_id).count(), 0)

    def test_student_cannot_write_materi_and_sees_only_published_for_their_class(self):
        # Create a published material for class A
        materi_pub_a = Materi.objects.create(
            title="Materi A-Pub",
            description="Detail A",
            source_type="link",
            kelas=self.kelas_a,
            mapel=self.mapel,
            guru=self.teacher,
            status="Dipublikasikan"
        )
        # Create a draft material for class A
        materi_draft_a = Materi.objects.create(
            title="Materi A-Draft",
            description="Detail A Draft",
            source_type="link",
            kelas=self.kelas_a,
            mapel=self.mapel,
            guru=self.teacher,
            status="Draft"
        )
        # Create a published material for class B
        materi_pub_b = Materi.objects.create(
            title="Materi B-Pub",
            description="Detail B",
            source_type="link",
            kelas=self.kelas_b,
            mapel=self.mapel,
            guru=self.teacher,
            status="Dipublikasikan"
        )

        self.client.force_authenticate(user=self.siswa)

        # Student cannot write (POST)
        payload = {
            "title": "Materi Siswa",
            "description": "Pengenalan kinetika partikel",
            "sourceType": "link",
            "kelasId": self.kelas_a.id,
            "mapelId": self.mapel.id,
            "status": "Dipublikasikan"
        }
        response = self.client.post(self.materi_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Student listing materials only gets published materials for their class (Kelas A)
        response = self.client.get(self.materi_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data["data"]
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["title"], "Materi A-Pub")

    def test_student_submission_scenarios(self):
        # 1. Create a published assignment
        tugas = Tugas.objects.create(
            title="Tugas Termodinamika",
            description="Kerjakan bab 4",
            due_date=datetime.date.today() + datetime.timedelta(days=1),
            kelas=self.kelas_a,
            mapel=self.mapel,
            guru=self.teacher,
            status="Dipublikasikan"
        )

        # 2. Student submits on time
        self.client.force_authenticate(user=self.siswa)
        payload = {
            "tugasId": tugas.id,
            "fileUrl": "https://example.com/siswa-termo.pdf"
        }
        response = self.client.post(self.submissions_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["status"], "Terkumpul")

        # 3. Student resubmits (allowed since not graded yet)
        payload_new = {
            "tugasId": tugas.id,
            "fileUrl": "https://example.com/siswa-termo-v2.pdf"
        }
        response = self.client.post(self.submissions_url, payload_new, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Submission.objects.get(tugas=tugas, siswa=self.siswa).file_url, "https://example.com/siswa-termo-v2.pdf")

        # 4. Teacher grades the assignment
        self.client.force_authenticate(user=self.teacher)
        submission = Submission.objects.get(tugas=tugas, siswa=self.siswa)
        grade_url = f"{self.submissions_url}{submission.id}/grade/"
        response = self.client.patch(grade_url, {"grade": 85, "feedback": "Kerja bagus!"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        submission.refresh_from_db()
        self.assertEqual(submission.grade, 85)
        self.assertEqual(submission.feedback, "Kerja bagus!")

        # 5. Student resubmitting now should FAIL
        self.client.force_authenticate(user=self.siswa)
        response = self.client.post(self.submissions_url, payload_new, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data["success"])
        self.assertEqual(response.data["message"], "Tidak dapat mengumpulkan ulang tugas yang sudah dinilai.")

    def test_student_submission_late(self):
        # 1. Create a published assignment that is already overdue
        tugas_past = Tugas.objects.create(
            title="Tugas Overdue",
            description="Kerjakan bab 1",
            due_date=datetime.date.today() - datetime.timedelta(days=2),
            kelas=self.kelas_a,
            mapel=self.mapel,
            guru=self.teacher,
            status="Dipublikasikan"
        )

        # 2. Student submits late
        self.client.force_authenticate(user=self.siswa)
        payload = {
            "tugasId": tugas_past.id,
            "fileUrl": "https://example.com/siswa-overdue.pdf"
        }
        response = self.client.post(self.submissions_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["status"], "Late")

    def test_teacher_cannot_create_or_list_material_for_unrelated_class(self):
        unrelated_material = Materi.objects.create(
            title="Materi Kelas B",
            description="Tidak boleh terlihat",
            source_type="link",
            kelas=self.kelas_b,
            mapel=self.mapel,
            guru=self.teacher_other,
            status="Dipublikasikan",
        )
        self.client.force_authenticate(user=self.teacher)

        list_response = self.client.get(self.materi_url)
        returned_ids = {row["id"] for row in list_response.data["data"]}
        self.assertNotIn(unrelated_material.id, returned_ids)

        create_response = self.client.post(
            self.materi_url,
            {
                "title": "Percobaan Materi Kelas B",
                "description": "Tidak boleh dibuat",
                "sourceType": "link",
                "kelasId": self.kelas_b.id,
                "mapelId": self.mapel.id,
                "status": "Dipublikasikan",
            },
            format="json",
        )
        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_cannot_create_or_move_material_to_unassigned_subject(self):
        material = Materi.objects.create(
            title="Materi Fisika",
            description="Materi yang valid",
            source_type="link",
            kelas=self.kelas_a,
            mapel=self.mapel,
            guru=self.teacher,
            status="Dipublikasikan",
        )
        self.client.force_authenticate(user=self.teacher)

        create_response = self.client.post(
            self.materi_url,
            {
                "title": "Materi Kimia",
                "description": "Mapel tidak diampu",
                "sourceType": "link",
                "kelasId": self.kelas_a.id,
                "mapelId": self.mapel_other.id,
                "status": "Dipublikasikan",
            },
            format="json",
        )
        update_response = self.client.patch(
            f"{self.materi_url}{material.id}/",
            {"mapelId": self.mapel_other.id},
            format="json",
        )

        self.assertEqual(create_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(update_response.status_code, status.HTTP_403_FORBIDDEN)

    def test_student_cannot_submit_assignment_from_another_class(self):
        tugas = Tugas.objects.create(
            title="Tugas Kelas B",
            description="Bukan untuk siswa kelas A",
            due_date=datetime.date.today() + datetime.timedelta(days=1),
            kelas=self.kelas_b,
            mapel=self.mapel,
            guru=self.teacher_other,
            status="Dipublikasikan",
        )
        self.client.force_authenticate(user=self.siswa)

        response = self.client.post(
            self.submissions_url,
            {"tugasId": tugas.id, "fileUrl": "https://example.com/answer.pdf"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_only_sees_submissions_for_owned_assignments(self):
        own_task = Tugas.objects.create(
            title="Tugas Guru",
            description="Tugas sendiri",
            due_date=datetime.date.today() + datetime.timedelta(days=1),
            kelas=self.kelas_a,
            mapel=self.mapel,
            guru=self.teacher,
            status="Dipublikasikan",
        )
        other_task = Tugas.objects.create(
            title="Tugas Guru Lain",
            description="Tugas guru lain",
            due_date=datetime.date.today() + datetime.timedelta(days=1),
            kelas=self.kelas_a,
            mapel=self.mapel,
            guru=self.teacher_other,
            status="Dipublikasikan",
        )
        own_submission = Submission.objects.create(
            tugas=own_task,
            siswa=self.siswa,
            status="Terkumpul",
        )
        other_submission = Submission.objects.create(
            tugas=other_task,
            siswa=self.siswa,
            status="Terkumpul",
        )
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(self.submissions_url)
        returned_ids = {row["id"] for row in response.data["data"]}

        self.assertIn(own_submission.id, returned_ids)
        self.assertNotIn(other_submission.id, returned_ids)

    def test_grade_must_be_between_zero_and_one_hundred(self):
        tugas = Tugas.objects.create(
            title="Tugas Nilai",
            description="Validasi nilai",
            due_date=datetime.date.today() + datetime.timedelta(days=1),
            kelas=self.kelas_a,
            mapel=self.mapel,
            guru=self.teacher,
            status="Dipublikasikan",
        )
        submission = Submission.objects.create(
            tugas=tugas,
            siswa=self.siswa,
            status="Terkumpul",
        )
        self.client.force_authenticate(user=self.teacher)

        response = self.client.patch(
            f"{self.submissions_url}{submission.id}/grade/",
            {"grade": 101, "feedback": "Tidak valid"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_file_upload_endpoint(self):
        self.client.force_authenticate(user=self.teacher)
        
        test_file = SimpleUploadedFile(
            "sample.pdf",
            b"%PDF-1.4\nvalid test content",
            content_type="application/pdf",
        )
        response = self.client.post(self.upload_url, {"file": test_file}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])
        self.assertIn("fileUrl", response.data["data"])
        self.assertTrue(response.data["data"]["fileUrl"].endswith("/media/uploads/sample.pdf") or "/media/uploads/sample" in response.data["data"]["fileUrl"])

    def test_file_upload_rejects_disallowed_file_type(self):
        self.client.force_authenticate(user=self.teacher)
        test_file = SimpleUploadedFile(
            "payload.exe",
            b"MZ",
            content_type="application/octet-stream",
        )

        response = self.client.post(
            self.upload_url,
            {"file": test_file},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_file_upload_rejects_spoofed_content_type(self):
        self.client.force_authenticate(user=self.teacher)
        test_file = SimpleUploadedFile(
            "payload.pdf",
            b"MZ executable content",
            content_type="application/pdf",
        )

        response = self.client.post(
            self.upload_url,
            {"file": test_file},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_file_upload_sanitizes_filename(self):
        self.client.force_authenticate(user=self.teacher)
        test_file = SimpleUploadedFile(
            "unsafe name<>.pdf",
            b"%PDF-1.4\nvalid test content",
            content_type="application/pdf",
        )

        response = self.client.post(
            self.upload_url,
            {"file": test_file},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("<", response.data["data"]["fileUrl"])
        self.assertNotIn(">", response.data["data"]["fileUrl"])
        self.assertNotIn(" ", response.data["data"]["fileUrl"])

    @override_settings(REST_FRAMEWORK=THROTTLED_REST_FRAMEWORK)
    def test_file_upload_is_throttled(self):
        cache.clear()
        self.client.force_authenticate(user=self.teacher)
        first_file = SimpleUploadedFile(
            "first.pdf",
            b"%PDF-1.4\nfirst",
            content_type="application/pdf",
        )
        second_file = SimpleUploadedFile(
            "second.pdf",
            b"%PDF-1.4\nsecond",
            content_type="application/pdf",
        )

        first_response = self.client.post(
            self.upload_url,
            {"file": first_file},
            format="multipart",
        )
        second_response = self.client.post(
            self.upload_url,
            {"file": second_file},
            format="multipart",
        )
        cache.clear()

        self.assertEqual(first_response.status_code, status.HTTP_200_OK)
        self.assertEqual(
            second_response.status_code,
            status.HTTP_429_TOO_MANY_REQUESTS,
        )

    def test_file_upload_rejects_files_larger_than_ten_megabytes(self):
        self.client.force_authenticate(user=self.teacher)
        test_file = SimpleUploadedFile(
            "oversized.pdf",
            b"x" * (10 * 1024 * 1024 + 1),
            content_type="application/pdf",
        )

        response = self.client.post(
            self.upload_url,
            {"file": test_file},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
