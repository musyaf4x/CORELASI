from django.db import models
from django.conf import settings
from academic.models import Kelas, MataPelajaran

class Materi(models.Model):
    """Model representing learning materials uploaded/shared by teachers."""
    class SourceType(models.TextChoices):
        LINK = "link", "Link"
        FILE = "file", "File"

    class Status(models.TextChoices):
        DRAFT = "Draft", "Draft"
        DIPUBLIKASIKAN = "Dipublikasikan", "Dipublikasikan"

    title = models.CharField("Judul Materi", max_length=200)
    description = models.TextField("Deskripsi Materi")
    source_type = models.CharField("Tipe Sumber", max_length=10, choices=SourceType.choices)
    file_url = models.CharField("URL Berkas/Tautan", max_length=500, null=True, blank=True)
    date_created = models.DateField("Tanggal Dibuat", auto_now_add=True)
    kelas = models.ForeignKey(Kelas, on_delete=models.CASCADE, related_name="materi", verbose_name="Kelas")
    mapel = models.ForeignKey(MataPelajaran, on_delete=models.CASCADE, related_name="materi", verbose_name="Mata Pelajaran")
    guru = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="materi_diajar",
        verbose_name="Guru Pengajar"
    )
    status = models.CharField("Status Publikasi", max_length=20, choices=Status.choices, default=Status.DRAFT)

    class Meta:
        verbose_name = "Materi"
        verbose_name_plural = "Materi"
        ordering = ["-date_created", "-id"]

    def __str__(self):
        return f"{self.title} ({self.mapel.name})"


class Tugas(models.Model):
    """Model representing assignments/evaluations created by teachers."""
    class Status(models.TextChoices):
        DRAFT = "Draft", "Draft"
        DIPUBLIKASIKAN = "Dipublikasikan", "Dipublikasikan"

    title = models.CharField("Judul Tugas", max_length=200)
    description = models.TextField("Deskripsi Tugas")
    file_url = models.CharField("URL Lampiran Tugas", max_length=500, null=True, blank=True)
    due_date = models.DateField("Batas Tenggat Waktu")
    date_created = models.DateField("Tanggal Dibuat", auto_now_add=True)
    kelas = models.ForeignKey(Kelas, on_delete=models.CASCADE, related_name="tugas", verbose_name="Kelas")
    mapel = models.ForeignKey(MataPelajaran, on_delete=models.CASCADE, related_name="tugas", verbose_name="Mata Pelajaran")
    guru = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tugas_diberikan",
        verbose_name="Guru Pembuat"
    )
    status = models.CharField("Status Publikasi", max_length=20, choices=Status.choices, default=Status.DRAFT)

    class Meta:
        verbose_name = "Tugas"
        verbose_name_plural = "Tugas"
        ordering = ["due_date", "-id"]

    def __str__(self):
        return f"{self.title} ({self.mapel.name})"


class Submission(models.Model):
    """Model representing student submissions for assignments."""
    class Status(models.TextChoices):
        BELUM_MENGUMPULKAN = "Belum Mengumpulkan", "Belum Mengumpulkan"
        TERKUMPUL = "Terkumpul", "Terkumpul"
        LATE = "Late", "Late"

    tugas = models.ForeignKey(Tugas, on_delete=models.CASCADE, related_name="submissions", verbose_name="Tugas")
    siswa = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="submissions",
        verbose_name="Siswa"
    )
    submit_date = models.DateField("Tanggal Pengumpulan", auto_now_add=True)
    file_url = models.CharField("URL Jawaban Berkas/Tautan", max_length=500, null=True, blank=True)
    status = models.CharField("Status Pengumpulan", max_length=20, choices=Status.choices, default=Status.BELUM_MENGUMPULKAN)
    grade = models.IntegerField("Nilai", null=True, blank=True)
    feedback = models.TextField("Umpan Balik Guru", null=True, blank=True)

    class Meta:
        verbose_name = "Pengumpulan Tugas"
        verbose_name_plural = "Pengumpulan Tugas"
        unique_together = ("tugas", "siswa")

    def __str__(self):
        return f"{self.siswa.name} - {self.tugas.title}"
