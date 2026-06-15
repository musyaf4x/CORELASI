from django.db import models
from django.conf import settings
from academic.models import Kelas, MataPelajaran

class JurnalPertemuan(models.Model):
    """Model representing meetings/teaching journals logged by teachers (KBM)."""
    date = models.DateField("Tanggal Pertemuan")
    kelas = models.ForeignKey(Kelas, on_delete=models.CASCADE, related_name="journals", verbose_name="Kelas")
    mapel = models.ForeignKey(MataPelajaran, on_delete=models.CASCADE, related_name="journals", verbose_name="Mata Pelajaran")
    guru = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="journals",
        verbose_name="Guru Pengajar"
    )
    agenda = models.CharField("Agenda/Topik Bahasan", max_length=200)
    material_summary = models.TextField("Ringkasan Materi")
    present_count = models.IntegerField("Jumlah Siswa Hadir")
    absent_count = models.IntegerField("Jumlah Siswa Absen")
    notes = models.TextField("Catatan Tambahan", null=True, blank=True)

    class Meta:
        verbose_name = "Jurnal Pertemuan"
        verbose_name_plural = "Jurnal Pertemuan"
        ordering = ["-date", "-id"]

    def __str__(self):
        return f"{self.date} - {self.kelas.name} - {self.mapel.name}"
