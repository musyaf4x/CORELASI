from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

from academic.models import Kelas, MataPelajaran, Semester, TahunAjaran
from attendance.models import AbsensiSiswa, PermintaanKoreksi, StatusKehadiran
from schedules.models import JadwalPelajaran

User = get_user_model()


class AttendanceAPITests(APITestCase):
    """Integration API tests for Attendance app (AbsensiSiswa & PermintaanKoreksi)."""

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
            role="guru",
            is_piket_today=True,
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
        self.kelas = Kelas.objects.create(name="XI-A", tingkat="XI", wali_kelas=self.teacher)
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
        self.siswa.kelas = self.kelas
        self.siswa.save(update_fields=["kelas"])
        self.siswa_other.kelas = self.kelas
        self.siswa_other.save(update_fields=["kelas"])

        # URLs
        self.siswa_list_url = "/api/attendance/siswa/"
        self.batch_url = "/api/attendance/siswa/batch/"
        self.koreksi_list_url = "/api/attendance/koreksi/"

    def test_teacher_can_submit_attendance_batch(self):
        self.client.force_authenticate(user=self.teacher)

        payload = [
            {
                "siswaId": self.siswa.id,
                "kelasId": self.kelas.id,
                "mapelId": self.mapel.id,
                "tanggal": "2026-06-08",
                "status": "Hadir",
                "keterangan": "Masuk tepat waktu"
            },
            {
                "siswaId": self.siswa_other.id,
                "kelasId": self.kelas.id,
                "mapelId": self.mapel.id,
                "tanggal": "2026-06-08",
                "status": "Izin",
                "keterangan": "Ada acara keluarga"
            }
        ]

        response = self.client.post(self.batch_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        # Check in DB
        self.assertEqual(AbsensiSiswa.objects.count(), 2)
        rec = AbsensiSiswa.objects.get(siswa=self.siswa)
        self.assertEqual(rec.status, "Hadir")
        self.assertEqual(rec.keterangan, "Masuk tepat waktu")

    def test_teacher_can_update_existing_attendance_batch(self):
        # Create existing record first
        AbsensiSiswa.objects.create(
            siswa=self.siswa,
            kelas=self.kelas,
            mapel=self.mapel,
            tanggal="2026-06-08",
            status="Alpa",
            keterangan="Initial alpa"
        )

        self.client.force_authenticate(user=self.teacher)

        payload = [
            {
                "siswaId": self.siswa.id,
                "kelasId": self.kelas.id,
                "mapelId": self.mapel.id,
                "tanggal": "2026-06-08",
                "status": "Hadir",
                "keterangan": "Terlambat tapi hadir"
            }
        ]

        response = self.client.post(self.batch_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        # Check in DB that it is updated
        self.assertEqual(AbsensiSiswa.objects.count(), 1)
        rec = AbsensiSiswa.objects.get(siswa=self.siswa)
        self.assertEqual(rec.status, "Hadir")
        self.assertEqual(rec.keterangan, "Terlambat tapi hadir")

    def test_student_cannot_submit_attendance_batch(self):
        self.client.force_authenticate(user=self.siswa)
        response = self.client.post(self.batch_url, [], format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_cannot_submit_attendance_for_unrelated_class(self):
        unrelated_class = Kelas.objects.create(name="XII-C", tingkat="XII")
        unrelated_student = User.objects.create_user(
            email="unrelated@corelasi.test",
            password="password123",
            name="Unrelated Student",
            role="siswa",
            kelas=unrelated_class,
        )
        self.teacher.is_piket_today = False
        self.teacher.save(update_fields=["is_piket_today"])
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(
            self.batch_url,
            [
                {
                    "siswaId": unrelated_student.id,
                    "kelasId": unrelated_class.id,
                    "mapelId": self.mapel.id,
                    "tanggal": "2026-06-08",
                    "status": "Hadir",
                }
            ],
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_teacher_cannot_submit_attendance_for_unassigned_subject(self):
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(
            self.batch_url,
            [
                {
                    "siswaId": self.siswa.id,
                    "kelasId": self.kelas.id,
                    "mapelId": self.mapel_other.id,
                    "tanggal": "2026-06-08",
                    "status": "Hadir",
                }
            ],
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_attendance_rejects_student_from_a_different_class(self):
        other_class = Kelas.objects.create(name="XI-C", tingkat="XI")
        other_student = User.objects.create_user(
            email="different-class@corelasi.test",
            password="password123",
            name="Different Class",
            role="siswa",
            kelas=other_class,
        )
        self.client.force_authenticate(user=self.teacher)

        response = self.client.post(
            self.batch_url,
            [
                {
                    "siswaId": other_student.id,
                    "kelasId": self.kelas.id,
                    "mapelId": self.mapel.id,
                    "tanggal": "2026-06-08",
                    "status": "Hadir",
                }
            ],
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_non_piket_teacher_cannot_verify_correction_request(self):
        non_piket_teacher = User.objects.create_user(
            email="nonpiket@corelasi.test",
            password="password123",
            name="Guru Non Piket",
            role="guru",
        )
        koreksi = PermintaanKoreksi.objects.create(
            siswa=self.siswa,
            kelas=self.kelas,
            mapel_name="Fisika",
            status_semula="Alpa",
            status_koreksi="Hadir",
            keterangan="Bukti hadir tersedia",
            tanggal="2026-06-08",
        )

        self.client.force_authenticate(user=non_piket_teacher)
        response = self.client.patch(
            f"{self.koreksi_list_url}{koreksi.id}/verify/",
            {"statusKoreksi": "Hadir", "keterangan": "Disetujui"},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_non_piket_teacher_only_lists_corrections_for_accessible_classes(self):
        other_class = Kelas.objects.create(name="XII-D", tingkat="XII")
        other_student = User.objects.create_user(
            email="other-correction@corelasi.test",
            password="password123",
            name="Other Correction Student",
            role="siswa",
            kelas=other_class,
        )
        own_request = PermintaanKoreksi.objects.create(
            siswa=self.siswa,
            kelas=self.kelas,
            mapel_name="Fisika",
            status_semula="Alpa",
            status_koreksi="Hadir",
            keterangan="Kelas sendiri",
            tanggal="2026-06-08",
        )
        other_request = PermintaanKoreksi.objects.create(
            siswa=other_student,
            kelas=other_class,
            mapel_name="Fisika",
            status_semula="Alpa",
            status_koreksi="Hadir",
            keterangan="Kelas lain",
            tanggal="2026-06-08",
        )
        self.teacher.is_piket_today = False
        self.teacher.save(update_fields=["is_piket_today"])
        self.client.force_authenticate(user=self.teacher)

        response = self.client.get(self.koreksi_list_url)
        returned_ids = {row["id"] for row in response.data["data"]}

        self.assertIn(own_request.id, returned_ids)
        self.assertNotIn(other_request.id, returned_ids)

    def test_student_cannot_create_correction_for_another_student(self):
        self.siswa.kelas = self.kelas
        self.siswa.save(update_fields=["kelas"])
        self.siswa_other.kelas = self.kelas
        self.siswa_other.save(update_fields=["kelas"])
        self.client.force_authenticate(user=self.siswa)

        response = self.client.post(
            self.koreksi_list_url,
            {
                "siswaId": self.siswa_other.id,
                "kelasId": self.kelas.id,
                "mapelName": "Fisika",
                "statusSemula": "Alpa",
                "statusKoreksi": "Hadir",
                "keterangan": "Percobaan spoofing",
                "tanggal": "2026-06-08",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["data"]["siswaId"], self.siswa.id)

    def test_student_cannot_create_correction_for_another_class(self):
        other_class = Kelas.objects.create(name="XII-B", tingkat="XII")
        self.siswa.kelas = self.kelas
        self.siswa.save(update_fields=["kelas"])
        self.client.force_authenticate(user=self.siswa)

        response = self.client.post(
            self.koreksi_list_url,
            {
                "kelasId": other_class.id,
                "mapelName": "Fisika",
                "statusSemula": "Alpa",
                "statusKoreksi": "Hadir",
                "keterangan": "Kelas tidak sesuai",
                "tanggal": "2026-06-08",
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_correction_request_and_verification_pipeline(self):
        # 1. First, teacher posts initial attendance as Alpa (Absent)
        self.client.force_authenticate(user=self.teacher)
        AbsensiSiswa.objects.create(
            siswa=self.siswa,
            kelas=self.kelas,
            tanggal="2026-06-08",
            status="Alpa",
            keterangan="Tidak ada keterangan"
        )

        # 2. Student logs in and files a correction request (e.g. was actually Sakit)
        self.client.force_authenticate(user=self.siswa)
        payload = {
            "siswaId": self.siswa.id,
            "kelasId": self.kelas.id,
            "mapelName": "Fisika",
            "statusSemula": "Alpa",
            "statusKoreksi": "Sakit",
            "keterangan": "Surat dokter terlampir",
            "tanggal": "2026-06-08"
        }
        response = self.client.post(self.koreksi_list_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data["success"])
        koreksi_id = response.data["data"]["id"]

        # Check DB
        koreksi = PermintaanKoreksi.objects.get(id=koreksi_id)
        self.assertEqual(koreksi.status_koreksi, "Sakit")
        self.assertFalse(koreksi.verified)

        # 3. Student cannot verify the request themselves
        verify_url = f"{self.koreksi_list_url}{koreksi_id}/verify/"
        response = self.client.patch(verify_url, {"statusKoreksi": "Sakit", "keterangan": "Koreksi disetujui"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 4. Teacher (Guru Piket) verifies the correction request
        self.client.force_authenticate(user=self.teacher)
        response = self.client.patch(verify_url, {"statusKoreksi": "Sakit", "keterangan": "Disetujui berdasarkan surat dokter"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        # Check DB to see if request is verified
        koreksi.refresh_from_db()
        self.assertTrue(koreksi.verified)

        # Check DB to see if student's attendance is corrected
        absensi = AbsensiSiswa.objects.get(siswa=self.siswa, tanggal="2026-06-08")
        self.assertEqual(absensi.status, "Sakit")
        self.assertEqual(absensi.keterangan, "Koreksi disetujui: Disetujui berdasarkan surat dokter")

    def test_admin_attendance_override(self):
        # 1. Create an attendance record
        absensi = AbsensiSiswa.objects.create(
            siswa=self.siswa,
            kelas=self.kelas,
            tanggal="2026-06-08",
            status="Hadir"
        )

        # 2. Non-admin trying to override gets 403
        self.client.force_authenticate(user=self.teacher)
        override_url = f"{self.siswa_list_url}{absensi.id}/override/"
        response = self.client.patch(override_url, {"statusBaru": "Alpa", "alasanOverride": "Ternyata bolos"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Admin successfully overrides
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(override_url, {"statusBaru": "Alpa", "alasanOverride": "Ternyata bolos"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data["success"])

        # Check DB
        absensi.refresh_from_db()
        self.assertEqual(absensi.status, "Alpa")
        self.assertEqual(absensi.status_awal, "Hadir")  # Initial status preserved
        self.assertEqual(absensi.keterangan, "Override Admin: Ternyata bolos")

    def test_guru_pengampu_status_restrictions(self):
        # Create a non-piket guru (regular Guru Pengampu)
        regular_guru = User.objects.create_user(
            email="regular_guru@corelasi.test",
            password="password123",
            name="Regular Guru",
            role="guru",
            is_piket_today=False
        )
        from academic.models import Semester
        active_semester = Semester.objects.filter(status="aktif").first()
        JadwalPelajaran.objects.create(
            kelas=self.kelas,
            mapel=self.mapel,
            guru=regular_guru,
            hari="Selasa",
            waktu_mulai="08:00",
            waktu_selesai="09:30",
            semester=active_semester
        )

        self.client.force_authenticate(user=regular_guru)

        # 1. Guru Pengampu can submit Hadir and Alpa
        payload_ok = [
            {
                "siswaId": self.siswa.id,
                "kelasId": self.kelas.id,
                "mapelId": self.mapel.id,
                "tanggal": "2026-06-09",
                "status": "Hadir",
                "keterangan": "Hadir"
            },
            {
                "siswaId": self.siswa_other.id,
                "kelasId": self.kelas.id,
                "mapelId": self.mapel.id,
                "tanggal": "2026-06-09",
                "status": "Alpa",
                "keterangan": "Bolos"
            }
        ]
        response = self.client.post(self.batch_url, payload_ok, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # 2. Guru Pengampu is rejected when submitting Sakit
        payload_sakit = [
            {
                "siswaId": self.siswa.id,
                "kelasId": self.kelas.id,
                "mapelId": self.mapel.id,
                "tanggal": "2026-06-10",
                "status": "Sakit",
                "keterangan": "Sakit"
            }
        ]
        response = self.client.post(self.batch_url, payload_sakit, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data["errors"])

        # 3. Guru Pengampu is rejected when submitting Izin
        payload_izin = [
            {
                "siswaId": self.siswa.id,
                "kelasId": self.kelas.id,
                "mapelId": self.mapel.id,
                "tanggal": "2026-06-10",
                "status": "Izin",
                "keterangan": "Izin"
            }
        ]
        response = self.client.post(self.batch_url, payload_izin, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 4. Guru Pengampu is blocked from overwriting existing Sakit/Izin record
        # Set up an existing Sakit record
        abs_sakit = AbsensiSiswa.objects.create(
            siswa=self.siswa,
            kelas=self.kelas,
            mapel=self.mapel,
            tanggal="2026-06-11",
            status="Sakit",
            keterangan="Sakit disetujui piket"
        )
        payload_overwrite = [
            {
                "siswaId": self.siswa.id,
                "kelasId": self.kelas.id,
                "mapelId": self.mapel.id,
                "tanggal": "2026-06-11",
                "status": "Hadir",
                "keterangan": "Coba ubah ke Hadir"
            }
        ]
        response = self.client.post(self.batch_url, payload_overwrite, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("status", response.data["errors"])

        # 5. Guru Pengampu can submit batch with existing Sakit/Izin if left unchanged
        payload_unchanged = [
            {
                "siswaId": self.siswa.id,
                "kelasId": self.kelas.id,
                "mapelId": self.mapel.id,
                "tanggal": "2026-06-11",
                "status": "Sakit",
                "keterangan": "Sakit disetujui piket"
            }
        ]
        response = self.client.post(self.batch_url, payload_unchanged, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
