from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class UserManager(BaseUserManager):
    """Custom manager for User model where email is the unique identifier for auth."""
    
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Alamat email harus diisi")
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "admin")
        extra_fields.setdefault("status", "aktif")

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser harus memiliki is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser harus memiliki is_superuser=True.")

        return self.create_user(email, password, **extra_fields)

class User(AbstractUser):
    """Custom User model for CORELASI supporting admin, guru, and siswa roles."""
    
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("guru", "Guru"),
        ("siswa", "Siswa"),
    )
    STATUS_CHOICES = (
        ("aktif", "Aktif"),
        ("nonaktif", "Nonaktif"),
    )
    GENDER_CHOICES = (
        ("L", "Laki-laki"),
        ("P", "Perempuan"),
    )

    username = None  # Remove username field
    email = models.EmailField("Alamat Email", unique=True)
    name = models.CharField("Nama Lengkap", max_length=150)
    role = models.CharField("Role Pengguna", max_length=10, choices=ROLE_CHOICES, default="siswa")
    status = models.CharField("Status", max_length=10, choices=STATUS_CHOICES, default="aktif")
    
    # Extended Profile Fields
    nip_or_nis = models.CharField("NIP / NIS", max_length=50, null=True, blank=True)
    gender = models.CharField("Jenis Kelamin", max_length=2, choices=GENDER_CHOICES, null=True, blank=True)
    phone_number = models.CharField("Nomor Telepon", max_length=20, null=True, blank=True)
    angkatan = models.IntegerField("Angkatan", null=True, blank=True)
    
    # ForeignKey to Kelas (using string relation to prevent circular dependency)
    kelas = models.ForeignKey(
        "academic.Kelas",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
        verbose_name="Kelas (Siswa)"
    )

    # Teacher Assignments Flags
    is_pengampu = models.BooleanField("Penugasan Pengampu", default=False)
    is_piket_today = models.BooleanField("Piket Hari Ini", default=False)
    is_wali_kelas = models.BooleanField("Wali Kelas (Cadangan)", default=False)

    # Override defaults
    first_name = None
    last_name = None

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        verbose_name = "User"
        verbose_name_plural = "Users"

    def __str__(self):
        return f"{self.name} ({self.get_role_display()})"


class PasswordResetRequest(models.Model):
    """Model to track password reset requests submitted by users and resolved by Admin."""
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("resolved", "Resolved"),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reset_requests",
        verbose_name="Pengguna"
    )
    requested_at = models.DateTimeField("Waktu Pengajuan", auto_now_add=True)
    status = models.CharField("Status", max_length=10, choices=STATUS_CHOICES, default="pending")

    class Meta:
        verbose_name = "Password Reset Request"
        verbose_name_plural = "Password Reset Requests"
        ordering = ["-requested_at"]

    def __str__(self):
        return f"Reset {self.user.email} - {self.status}"
