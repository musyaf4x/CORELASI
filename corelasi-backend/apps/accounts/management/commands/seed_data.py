import datetime
import random
from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth import get_user_model

from academic.models import TahunAjaran, Semester, Kelas, MataPelajaran
from schedules.models import JadwalPelajaran, JadwalPiket
from attendance.models import AbsensiSiswa, PermintaanKoreksi, StatusKehadiran
from learning.models import Materi, Tugas, Submission
from journals.models import JurnalPertemuan

User = get_user_model()

class Command(BaseCommand):
    help = "Seeds the database with mock school data for CORELASI testing."

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING("Starting database seeding..."))

        try:
            with transaction.atomic():
                self.clear_existing_data()
                self.seed_data()
            self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error seeding database: {e}"))
            raise e

    def clear_existing_data(self):
        self.stdout.write("Clearing existing data...")
        # Clear child dependencies first
        Submission.objects.all().delete()
        Tugas.objects.all().delete()
        Materi.objects.all().delete()
        JurnalPertemuan.objects.all().delete()
        PermintaanKoreksi.objects.all().delete()
        AbsensiSiswa.objects.all().delete()
        JadwalPelajaran.objects.all().delete()
        JadwalPiket.objects.all().delete()
        
        # Set User.kelas to None to break circular reference before deleting Kelas
        User.objects.all().update(kelas=None)
        Kelas.objects.all().delete()
        
        # Clear remaining parents
        MataPelajaran.objects.all().delete()
        Semester.objects.all().delete()
        TahunAjaran.objects.all().delete()
        User.objects.all().delete()

    def seed_data(self):
        # 1. Create Users
        self.stdout.write("Seeding users...")
        
        # Admin
        admin = User.objects.create_user(
            email="admin@corelasi.test",
            password="password123",
            name="Administrator Utama",
            role="admin",
            status="aktif",
        )
        
        # Teachers (Guru)
        guru_math = User.objects.create_user(
            email="guru@corelasi.test",
            password="password123",
            name="Drs. Budi Setiawan",
            role="guru",
            status="aktif",
            nip_or_nis="198001012005011001",
            gender="L",
            is_pengampu=True,
            is_wali_kelas=True,
        )
        
        guru_piket = User.objects.create_user(
            email="guru_piket@corelasi.test",
            password="password123",
            name="Siti Rahmawati, S.Pd",
            role="guru",
            status="aktif",
            nip_or_nis="198502022010022002",
            gender="P",
            is_piket_today=True,
        )

        guru_science = User.objects.create_user(
            email="guru_science@corelasi.test",
            password="password123",
            name="Ahmad Hidayat, M.Si",
            role="guru",
            status="aktif",
            nip_or_nis="197803032003031003",
            gender="L",
            is_pengampu=True,
        )
        
        # Students (Siswa)
        siswa_1 = User.objects.create_user(
            email="siswa@corelasi.test",
            password="password123",
            name="Rian Adi Wijaya",
            role="siswa",
            status="aktif",
            nip_or_nis="202410001",
            gender="L",
        )
        
        siswa_2 = User.objects.create_user(
            email="siswa2@corelasi.test",
            password="password123",
            name="Annisa Putri",
            role="siswa",
            status="aktif",
            nip_or_nis="202410002",
            gender="P",
        )

        siswa_3 = User.objects.create_user(
            email="siswa3@corelasi.test",
            password="password123",
            name="Bambang Pamungkas",
            role="siswa",
            status="aktif",
            nip_or_nis="202410003",
            gender="L",
        )

        # 2. Create Tahun Ajaran & Semester
        self.stdout.write("Seeding academic structure...")
        ta = TahunAjaran.objects.create(
            name="2025/2026",
            status="aktif",
            tanggal_mulai=datetime.date(2025, 7, 15),
            tanggal_selesai=datetime.date(2026, 6, 15)
        )
        
        sem_ganjil = Semester.objects.create(
            name="Ganjil",
            tahun_ajaran=ta,
            status="aktif",
            tanggal_mulai=datetime.date(2025, 7, 15),
            tanggal_selesai=datetime.date(2025, 12, 20)
        )
        
        sem_genap = Semester.objects.create(
            name="Genap",
            tahun_ajaran=ta,
            status="nonaktif",
            tanggal_mulai=datetime.date(2026, 1, 5),
            tanggal_selesai=datetime.date(2026, 6, 15)
        )

        # 3. Create Mata Pelajaran
        self.stdout.write("Seeding subjects...")
        mapel_mat = MataPelajaran.objects.create(name="Matematika", kode="MAPEL-MAT")
        mapel_ind = MataPelajaran.objects.create(name="Bahasa Indonesia", kode="MAPEL-IND")
        mapel_ing = MataPelajaran.objects.create(name="Bahasa Inggris", kode="MAPEL-ING")
        mapel_fis = MataPelajaran.objects.create(name="Fisika", kode="MAPEL-FIS")

        # 4. Create Kelas
        self.stdout.write("Seeding classes...")
        # X-A has Drs. Budi Setiawan (guru_math) as Wali Kelas
        kelas_x_a = Kelas.objects.create(
            name="X-A",
            tingkat="X",
            wali_kelas=guru_math
        )
        # XI-A has Siti Rahmawati (guru_piket) as Wali Kelas
        kelas_xi_a = Kelas.objects.create(
            name="XI-A",
            tingkat="XI",
            wali_kelas=guru_piket
        )

        # Assign students to classes
        siswa_1.kelas = kelas_x_a
        siswa_1.save()
        
        siswa_2.kelas = kelas_x_a
        siswa_2.save()
        
        siswa_3.kelas = kelas_xi_a
        siswa_3.save()

        # 5. Create Schedules (Jadwal Pelajaran & Piket)
        self.stdout.write("Seeding schedules...")
        # Matematika on Senin (07:30 - 09:00) for X-A
        JadwalPelajaran.objects.create(
            kelas=kelas_x_a,
            mapel=mapel_mat,
            guru=guru_math,
            hari="Senin",
            waktu_mulai=datetime.time(7, 30),
            waktu_selesai=datetime.time(9, 0),
            semester=sem_ganjil
        )
        # Bahasa Indonesia on Senin (09:15 - 10:45) for X-A
        JadwalPelajaran.objects.create(
            kelas=kelas_x_a,
            mapel=mapel_ind,
            guru=guru_piket,
            hari="Senin",
            waktu_mulai=datetime.time(9, 15),
            waktu_selesai=datetime.time(10, 45),
            semester=sem_ganjil
        )
        # Fisika on Rabu (07:30 - 09:00) for XI-A
        JadwalPelajaran.objects.create(
            kelas=kelas_xi_a,
            mapel=mapel_fis,
            guru=guru_science,
            hari="Rabu",
            waktu_mulai=datetime.time(7, 30),
            waktu_selesai=datetime.time(9, 0),
            semester=sem_ganjil
        )

        # Jadwal Piket for teachers
        JadwalPiket.objects.create(
            guru=guru_piket,
            hari="Senin",
            semester=sem_ganjil
        )
        JadwalPiket.objects.create(
            guru=guru_math,
            hari="Selasa",
            semester=sem_ganjil
        )

        # 6. Seeding Attendance (Absensi Siswa & Koreksi)
        self.stdout.write("Seeding attendance logs...")
        today = datetime.date.today()
        # Backdate 5 days of attendance for students in X-A
        for i in range(5):
            date = today - datetime.timedelta(days=i)
            # Skip Sundays
            if date.weekday() == 6:
                continue
                
            # Siswa 1 (Rian)
            AbsensiSiswa.objects.create(
                siswa=siswa_1,
                kelas=kelas_x_a,
                mapel=mapel_mat,
                tanggal=date,
                status=StatusKehadiran.HADIR,
                keterangan="Masuk tepat waktu"
            )
            # Siswa 2 (Annisa)
            status_siswa2 = StatusKehadiran.HADIR
            ket_siswa2 = "Hadir"
            if i == 2:
                status_siswa2 = StatusKehadiran.SAKIT
                ket_siswa2 = "Sakit Demam (Ada Surat)"
            elif i == 4:
                status_siswa2 = StatusKehadiran.IZIN
                ket_siswa2 = "Acara Keluarga"
                
            AbsensiSiswa.objects.create(
                siswa=siswa_2,
                kelas=kelas_x_a,
                mapel=mapel_mat,
                tanggal=date,
                status=status_siswa2,
                keterangan=ket_siswa2
            )

        # Seed correction request (Permintaan Koreksi)
        # Siswa 1 wants to correct an Alpa on a mapel backdate
        PermintaanKoreksi.objects.create(
            siswa=siswa_1,
            kelas=kelas_x_a,
            mapel_name="Bahasa Indonesia",
            status_semula=StatusKehadiran.ALPA,
            status_koreksi=StatusKehadiran.HADIR,
            keterangan="Lupa melakukan tapping kehadiran karena terburu-buru masuk kelas.",
            verified=False,
            tanggal=today - datetime.timedelta(days=1)
        )

        # 7. Seeding KBM Journals
        self.stdout.write("Seeding KBM journals...")
        JurnalPertemuan.objects.create(
            date=today - datetime.timedelta(days=1),
            kelas=kelas_x_a,
            mapel=mapel_mat,
            guru=guru_math,
            agenda="Sistem Persamaan Linier Dua Variabel",
            material_summary="Pembahasan metode eliminasi dan substitusi pada SPLDV, pengerjaan latihan soal halaman 45.",
            present_count=2,
            absent_count=0,
            notes="Siswa aktif berpartisipasi dan memahami materi dengan baik."
        )

        # 8. Seeding Learning materials and tasks
        self.stdout.write("Seeding learning materials and tasks...")
        # Material
        Materi.objects.create(
            title="Pengenalan Aljabar Linier",
            description="Materi dasar mengenai variabel, konstanta, dan operasi dasar aljabar.",
            source_type="link",
            file_url="https://youtube.com/watch?v=demoaljabar",
            kelas=kelas_x_a,
            mapel=mapel_mat,
            guru=guru_math,
            status="Dipublikasikan"
        )
        
        # Task
        tugas = Tugas.objects.create(
            title="Latihan Soal SPLDV",
            description="Kerjakan soal nomor 1-10 di buku cetak halaman 48. Foto jawaban dan kumpulkan di sini.",
            file_url="https://drive.google.com/file/d/demosplit",
            due_date=today + datetime.timedelta(days=3),
            kelas=kelas_x_a,
            mapel=mapel_mat,
            guru=guru_math,
            status="Dipublikasikan"
        )
        
        # Submission
        Submission.objects.create(
            tugas=tugas,
            siswa=siswa_1,
            submit_date=today,
            file_url="https://drive.google.com/file/d/siswa1-jawaban",
            status="Terkumpul",
            grade=85,
            feedback="Pekerjaan rapi, langkah eliminasi tepat."
        )
        
        Submission.objects.create(
            tugas=tugas,
            siswa=siswa_2,
            submit_date=today,
            file_url="https://drive.google.com/file/d/siswa2-jawaban",
            status="Terkumpul",
            grade=None, # Not graded yet
            feedback=""
        )
