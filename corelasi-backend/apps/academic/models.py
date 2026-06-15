from django.db import models
from django.conf import settings

class TahunAjaran(models.Model):
    """Model representing school academic year (e.g. 2025/2026)."""
    STATUS_CHOICES = (
        ("aktif", "Aktif"),
        ("nonaktif", "Tidak Aktif"),
    )

    name = models.CharField("Tahun Ajaran", max_length=50, unique=True)
    status = models.CharField("Status", max_length=10, choices=STATUS_CHOICES, default="aktif")
    tanggal_mulai = models.DateField("Tanggal Mulai")
    tanggal_selesai = models.DateField("Tanggal Selesai")

    class Meta:
        verbose_name = "Tahun Ajaran"
        verbose_name_plural = "Tahun Ajaran"
        ordering = ["-name"]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        if self.status == "aktif":
            # Deactivate all other academic years
            TahunAjaran.objects.exclude(id=self.id).update(status="nonaktif")
        super().save(*args, **kwargs)


class Semester(models.Model):
    """Model representing semester (Ganjil / Genap) bound to an academic year."""
    NAME_CHOICES = (
        ("Ganjil", "Ganjil"),
        ("Genap", "Genap"),
    )
    STATUS_CHOICES = (
        ("aktif", "Aktif"),
        ("nonaktif", "Tidak Aktif"),
    )

    name = models.CharField("Nama Semester", max_length=10, choices=NAME_CHOICES)
    tahun_ajaran = models.ForeignKey(
        TahunAjaran, 
        on_delete=models.CASCADE, 
        related_name="semesters",
        verbose_name="Tahun Ajaran"
    )
    status = models.CharField("Status", max_length=10, choices=STATUS_CHOICES, default="aktif")
    tanggal_mulai = models.DateField("Tanggal Mulai", null=True, blank=True)
    tanggal_selesai = models.DateField("Tanggal Selesai", null=True, blank=True)

    class Meta:
        verbose_name = "Semester"
        verbose_name_plural = "Semester"
        unique_together = ("name", "tahun_ajaran")
        ordering = ["tahun_ajaran", "name"]

    def __str__(self):
        return f"{self.tahun_ajaran.name} - {self.name}"

    def clean(self):
        from django.core.exceptions import ValidationError
        from django.utils.dateparse import parse_date
        import datetime

        super().clean()
        
        def to_date(val):
            if isinstance(val, str):
                return parse_date(val)
            return val

        tanggal_mulai = to_date(self.tanggal_mulai)
        tanggal_selesai = to_date(self.tanggal_selesai)
        
        # Check start and end dates
        if tanggal_mulai and tanggal_selesai:
            if tanggal_mulai > tanggal_selesai:
                raise ValidationError({
                    "tanggal_mulai": "Tanggal mulai tidak boleh setelah tanggal selesai."
                })
                
            # Check boundaries of TahunAjaran
            try:
                ta = self.tahun_ajaran
            except TahunAjaran.DoesNotExist:
                ta = None

            if ta:
                ta_mulai = to_date(ta.tanggal_mulai)
                ta_selesai = to_date(ta.tanggal_selesai)
                
                if (ta_mulai and tanggal_mulai < ta_mulai) or (ta_selesai and tanggal_selesai > ta_selesai):
                    raise ValidationError({
                        "tanggal_mulai": f"Tanggal semester harus berada di dalam rentang tahun ajaran ({ta_mulai} s.d. {ta_selesai})."
                    })
                
                # Check overlap with other semesters in the same TahunAjaran
                other_semesters = Semester.objects.filter(tahun_ajaran=ta)
                if self.id:
                    other_semesters = other_semesters.exclude(id=self.id)
                for other in other_semesters:
                    other_mulai = to_date(other.tanggal_mulai)
                    other_selesai = to_date(other.tanggal_selesai)
                    if other_mulai and other_selesai:
                        if tanggal_mulai <= other_selesai and other_mulai <= tanggal_selesai:
                            raise ValidationError({
                                "tanggal_mulai": f"Tanggal semester tumpang tindih dengan semester {other.name} ({other_mulai} s.d. {other_selesai})."
                            })

    def save(self, *args, **kwargs):
        self.clean()
        if self.status == "aktif":
            # Deactivate all other semesters
            Semester.objects.exclude(id=self.id).update(status="nonaktif")
        super().save(*args, **kwargs)


class Kelas(models.Model):
    """Model representing classroom (Rombongan Belajar) with assigned wali kelas (guru)."""
    TINGKAT_CHOICES = (
        ("X", "X"),
        ("XI", "XI"),
        ("XII", "XII"),
    )

    name = models.CharField("Nama Kelas", max_length=50)
    tingkat = models.CharField("Tingkat", max_length=5, choices=TINGKAT_CHOICES)
    wali_kelas = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="kelas_perwalian",
        verbose_name="Wali Kelas"
    )
    tahun_ajaran = models.ForeignKey(
        TahunAjaran,
        on_delete=models.CASCADE,
        related_name="classes",
        verbose_name="Tahun Ajaran",
        null=True,
        blank=True
    )

    class Meta:
        verbose_name = "Kelas"
        verbose_name_plural = "Kelas"
        unique_together = ("name", "tahun_ajaran")
        ordering = ["tingkat", "name"]

    def __str__(self):
        return f"{self.name} ({self.tahun_ajaran.name if self.tahun_ajaran else 'Tanpa TA'})"

    def clean(self):
        super().clean()
        if not self.tahun_ajaran:
            self.tahun_ajaran = TahunAjaran.objects.filter(status="aktif").first() or TahunAjaran.objects.first()

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)


class MataPelajaran(models.Model):
    """Model representing academic subjects (Mata Pelajaran)."""
    name = models.CharField("Nama Mata Pelajaran", max_length=100)
    kode = models.CharField("Kode Mata Pelajaran", max_length=20, unique=True, blank=True)

    class Meta:
        verbose_name = "Mata Pelajaran"
        verbose_name_plural = "Mata Pelajaran"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.kode})"

    def save(self, *args, **kwargs):
        if not self.kode:
            import re
            name_parts = [part for part in self.name.split() if part.isalnum()]
            if not name_parts:
                suffix = "MP"
            elif len(name_parts) > 1:
                suffix = "".join([part[0].upper() for part in name_parts])
            else:
                suffix = name_parts[0][:3].upper()
            
            # Strip non-alphanumeric characters
            suffix = re.sub(r'[^A-Z0-9]', '', suffix)
            if not suffix:
                suffix = "MP"
                
            base_code = f"MAPEL-{suffix}"
            code = base_code
            counter = 1
            # Check uniqueness
            while MataPelajaran.objects.filter(kode=code).exclude(id=self.id).exists():
                code = f"{base_code}-{counter}"
                counter += 1
            self.kode = code
            
        super().save(*args, **kwargs)
