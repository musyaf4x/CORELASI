from django.db import models
from django.conf import settings

class HariChoices(models.TextChoices):
    SENIN = "Senin", "Senin"
    SELASA = "Selasa", "Selasa"
    RABU = "Rabu", "Rabu"
    KAMIS = "Kamis", "Kamis"
    JUMAT = "Jumat", "Jumat"
    SABTU = "Sabtu", "Sabtu"


class JadwalPelajaran(models.Model):
    """Model representing a weekly classroom learning schedule."""
    kelas = models.ForeignKey(
        "academic.Kelas",
        on_delete=models.CASCADE,
        related_name="jadwal_pelajaran",
        verbose_name="Kelas"
    )
    mapel = models.ForeignKey(
        "academic.MataPelajaran",
        on_delete=models.CASCADE,
        related_name="jadwal_pelajaran",
        verbose_name="Mata Pelajaran"
    )
    guru = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="jadwal_mengajar",
        limit_choices_to={"role": "guru"},
        verbose_name="Guru Pengampu"
    )
    hari = models.CharField(
        "Hari",
        max_length=10,
        choices=HariChoices.choices
    )
    waktu_mulai = models.TimeField("Waktu Mulai")
    waktu_selesai = models.TimeField("Waktu Selesai")
    semester = models.ForeignKey(
        "academic.Semester",
        on_delete=models.CASCADE,
        related_name="jadwal_pelajaran",
        verbose_name="Semester"
    )

    class Meta:
        verbose_name = "Jadwal Pelajaran"
        verbose_name_plural = "Jadwal Pelajaran"
        ordering = ["semester", "hari", "waktu_mulai"]

    def __str__(self):
        return f"{self.kelas.name} - {self.mapel.name} ({self.hari} {self.waktu_mulai}-{self.waktu_selesai})"


class JadwalPiket(models.Model):
    """Model representing teacher's daily duty schedule."""
    guru = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="jadwal_piket",
        limit_choices_to={"role": "guru"},
        verbose_name="Guru Piket"
    )
    hari = models.CharField(
        "Hari Tugas",
        max_length=10,
        choices=HariChoices.choices
    )
    semester = models.ForeignKey(
        "academic.Semester",
        on_delete=models.CASCADE,
        related_name="jadwal_piket",
        verbose_name="Semester"
    )

    class Meta:
        verbose_name = "Jadwal Piket"
        verbose_name_plural = "Jadwal Piket"
        ordering = ["semester", "hari", "guru"]

    def __str__(self):
        return f"{self.guru.name} - Piket {self.hari}"
