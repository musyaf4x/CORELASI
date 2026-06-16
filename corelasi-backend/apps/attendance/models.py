from django.db import models
from django.conf import settings

class StatusKehadiran(models.TextChoices):
    HADIR = "Hadir", "Hadir"
    SAKIT = "Sakit", "Sakit"
    IZIN = "Izin", "Izin"
    ALPA = "Alpa", "Alpa"


class AbsensiSiswa(models.Model):
    """Model representing student attendance records."""
    siswa = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="absensi",
        limit_choices_to={"role": "siswa"},
        verbose_name="Siswa"
    )
    kelas = models.ForeignKey(
        "academic.Kelas",
        on_delete=models.CASCADE,
        related_name="absensi",
        verbose_name="Kelas"
    )
    mapel = models.ForeignKey(
        "academic.MataPelajaran",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="absensi",
        verbose_name="Mata Pelajaran"
    )
    tanggal = models.DateField("Tanggal")
    status = models.CharField(
        "Status Kehadiran",
        max_length=10,
        choices=StatusKehadiran.choices,
        default=StatusKehadiran.HADIR
    )
    status_awal = models.CharField(
        "Status Awal (Sebelum Override)",
        max_length=10,
        choices=StatusKehadiran.choices,
        null=True,
        blank=True
    )
    keterangan = models.TextField("Keterangan", null=True, blank=True)

    class Meta:
        verbose_name = "Absensi Siswa"
        verbose_name_plural = "Absensi Siswa"
        ordering = ["-tanggal", "kelas", "siswa"]
        unique_together = ("siswa", "kelas", "mapel", "tanggal")

    def __str__(self):
        mapel_str = f" - {self.mapel.name}" if self.mapel else ""
        return f"{self.tanggal} - {self.siswa.name} ({self.status}){mapel_str}"


class PermintaanKoreksi(models.Model):
    """Model representing requests submitted by students to correct erroneous attendance entries."""
    siswa = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="koreksi_presensi",
        limit_choices_to={"role": "siswa"},
        verbose_name="Siswa"
    )
    kelas = models.ForeignKey(
        "academic.Kelas",
        on_delete=models.CASCADE,
        related_name="koreksi_presensi",
        verbose_name="Kelas"
    )
    mapel_name = models.CharField("Nama Mata Pelajaran", max_length=100)
    status_semula = models.CharField(
        "Status Semula",
        max_length=10,
        choices=StatusKehadiran.choices
    )
    status_koreksi = models.CharField(
        "Status Koreksi",
        max_length=10,
        choices=StatusKehadiran.choices
    )
    keterangan = models.TextField("Alasan Koreksi")
    verified = models.BooleanField("Terverifikasi", default=False)
    tanggal = models.DateField("Tanggal Absensi")

    class Meta:
        verbose_name = "Permintaan Koreksi"
        verbose_name_plural = "Permintaan Koreksi"
        ordering = ["-tanggal", "siswa"]

    def __str__(self):
        return f"Koreksi {self.siswa.name} - {self.tanggal} ({self.status_semula} -> {self.status_koreksi})"
