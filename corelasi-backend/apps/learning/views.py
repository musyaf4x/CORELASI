import os
import datetime
import zipfile
from django.conf import settings
from django.db import transaction
from django.core.files.storage import default_storage
from django.utils.text import get_valid_filename
from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.permissions import BasePermission, SAFE_METHODS, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from learning.models import Materi, Tugas, Submission
from learning.serializers import MateriSerializer, TugasSerializer, SubmissionSerializer
from shared.access import can_teach_subject
from shared.responses import StandardResponse
from config.throttling import RuntimeScopedRateThrottle

ALLOWED_UPLOAD_TYPES = {
    ".pdf": {"application/pdf"},
    ".doc": {"application/msword"},
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    },
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".png": {"image/png"},
}


def has_allowed_file_signature(file_obj, extension):
    try:
        file_obj.seek(0)
        header = file_obj.read(8)
        file_obj.seek(0)

        if extension == ".pdf":
            return header.startswith(b"%PDF-")
        if extension in {".jpg", ".jpeg"}:
            return header.startswith(b"\xff\xd8\xff")
        if extension == ".png":
            return header == b"\x89PNG\r\n\x1a\n"
        if extension == ".doc":
            return header.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")
        if extension == ".docx":
            with zipfile.ZipFile(file_obj) as archive:
                names = set(archive.namelist())
                return (
                    "[Content_Types].xml" in names
                    and "word/document.xml" in names
                )
    except (OSError, ValueError, zipfile.BadZipFile):
        return False
    finally:
        file_obj.seek(0)
    return False

class IsAdminOrGuruOrReadOnly(BasePermission):
    """Permission class. Safe methods are open to all authenticated users; writes are restricted to Admin/Guru."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ["admin", "guru"]


class IsOwnerOrAdmin(BasePermission):
    """Permission class. Only the owner (guru) or admin can modify/delete the object."""
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.role == "admin":
            return True
        # Check if the object has a 'guru' field
        if hasattr(obj, "guru"):
            return obj.guru == request.user
        return False


class MateriViewSet(viewsets.ModelViewSet):
    """ViewSet to manage learning materials (Materi)."""
    queryset = Materi.objects.all().select_related("kelas", "mapel", "guru")
    serializer_class = MateriSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGuruOrReadOnly, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role == "siswa":
            if not user.kelas:
                return Materi.objects.none()
            queryset = queryset.filter(status="Dipublikasikan", kelas=user.kelas)
        elif user.role == "guru":
            queryset = queryset.filter(guru=user)
            
        kelas_id = self.request.query_params.get("kelasId")
        guru_id = self.request.query_params.get("guruId")
        mapel_id = self.request.query_params.get("mapelId")
        
        if kelas_id:
            queryset = queryset.filter(kelas_id=kelas_id)
        if guru_id:
            queryset = queryset.filter(guru_id=guru_id)
        if mapel_id:
            queryset = queryset.filter(mapel_id=mapel_id)
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return StandardResponse.success(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return StandardResponse.success(data=serializer.data)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if request.user.role == "guru":
            if not can_teach_subject(
                request.user,
                data.get("kelasId"),
                data.get("mapelId"),
            ):
                return StandardResponse.error(
                    message="Anda tidak memiliki akses ke kelas dan mata pelajaran materi tersebut.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            data["guruId"] = request.user.id

        serializer = self.get_serializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Materi pelajaran berhasil ditambahkan.",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Gagal menambahkan materi.",
                errors=errors if errors else str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        if request.user.role == "guru":
            kelas_id = data.get("kelasId", instance.kelas_id)
            mapel_id = data.get("mapelId", instance.mapel_id)
            if not can_teach_subject(request.user, kelas_id, mapel_id):
                return StandardResponse.error(
                    message="Anda tidak memiliki akses ke kelas dan mata pelajaran materi tersebut.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            data["guruId"] = request.user.id
        serializer = self.get_serializer(instance, data=data, partial=partial)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Materi pelajaran berhasil diperbarui."
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Gagal memperbarui materi.",
                errors=errors if errors else str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return StandardResponse.success(
            message="Materi pelajaran berhasil dihapus."
        )


class TugasViewSet(viewsets.ModelViewSet):
    """ViewSet to manage learning assignments (Tugas)."""
    queryset = Tugas.objects.all().select_related("kelas", "mapel", "guru")
    serializer_class = TugasSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGuruOrReadOnly, IsOwnerOrAdmin]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role == "siswa":
            if not user.kelas:
                return Tugas.objects.none()
            queryset = queryset.filter(status="Dipublikasikan", kelas=user.kelas)
        elif user.role == "guru":
            queryset = queryset.filter(guru=user)
            
        kelas_id = self.request.query_params.get("kelasId")
        guru_id = self.request.query_params.get("guruId")
        mapel_id = self.request.query_params.get("mapelId")
        
        if kelas_id:
            queryset = queryset.filter(kelas_id=kelas_id)
        if guru_id:
            queryset = queryset.filter(guru_id=guru_id)
        if mapel_id:
            queryset = queryset.filter(mapel_id=mapel_id)
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return StandardResponse.success(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return StandardResponse.success(data=serializer.data)

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        if request.user.role == "guru":
            if not can_teach_subject(
                request.user,
                data.get("kelasId"),
                data.get("mapelId"),
            ):
                return StandardResponse.error(
                    message="Anda tidak memiliki akses ke kelas dan mata pelajaran tugas tersebut.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            data["guruId"] = request.user.id

        serializer = self.get_serializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Tugas berhasil ditambahkan.",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Gagal menambahkan tugas.",
                errors=errors if errors else str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        data = request.data.copy()
        if request.user.role == "guru":
            kelas_id = data.get("kelasId", instance.kelas_id)
            mapel_id = data.get("mapelId", instance.mapel_id)
            if not can_teach_subject(request.user, kelas_id, mapel_id):
                return StandardResponse.error(
                    message="Anda tidak memiliki akses ke kelas dan mata pelajaran tugas tersebut.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            data["guruId"] = request.user.id
        serializer = self.get_serializer(instance, data=data, partial=partial)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Tugas berhasil diperbarui."
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Gagal memperbarui tugas.",
                errors=errors if errors else str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return StandardResponse.success(
            message="Tugas berhasil dihapus."
        )


class SubmissionViewSet(viewsets.ModelViewSet):
    """ViewSet to manage student submissions."""
    queryset = Submission.objects.all().select_related("tugas", "siswa")
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        
        if user.role == "siswa":
            queryset = queryset.filter(siswa=user)
        elif user.role == "guru":
            queryset = queryset.filter(tugas__guru=user)
            
        tugas_id = self.request.query_params.get("tugasId")
        siswa_id = self.request.query_params.get("siswaId")
        
        if tugas_id:
            queryset = queryset.filter(tugas_id=tugas_id)
        if siswa_id:
            queryset = queryset.filter(siswa_id=siswa_id)
            
        return queryset

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return StandardResponse.success(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return StandardResponse.success(data=serializer.data)

    def create(self, request, *args, **kwargs):
        """Action for student to submit solutions."""
        if request.user.role != "siswa":
            return StandardResponse.error(
                message="Hanya siswa yang dapat mengumpulkan tugas.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        tugas_id = request.data.get("tugasId")
        siswa_id = request.user.id
        file_url = request.data.get("fileUrl")
        
        if not tugas_id:
            return StandardResponse.error(
                message="tugasId wajib diisi.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        if not file_url:
            return StandardResponse.error(
                message="Berkas jawaban wajib diunggah.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            tugas = Tugas.objects.get(id=tugas_id)
        except Tugas.DoesNotExist:
            return StandardResponse.error(
                message="Tugas tidak ditemukan.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if tugas.status != "Dipublikasikan" or tugas.kelas_id != request.user.kelas_id:
            return StandardResponse.error(
                message="Anda tidak memiliki akses ke tugas tersebut.",
                status_code=status.HTTP_403_FORBIDDEN,
            )
        
        # Check if submission exists and has already been graded
        submission = Submission.objects.filter(tugas=tugas, siswa_id=siswa_id).first()
        if submission and submission.grade is not None:
            return StandardResponse.error(
                message="Tidak dapat mengumpulkan ulang tugas yang sudah dinilai.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
        
        # Compute late status
        today = datetime.date.today()
        status_val = "Late" if today > tugas.due_date else "Terkumpul"
        
        with transaction.atomic():
            obj, created = Submission.objects.update_or_create(
                tugas=tugas,
                siswa_id=siswa_id,
                defaults={
                    "file_url": file_url,
                    "status": status_val,
                }
            )
        
        serializer = self.get_serializer(obj)
        return StandardResponse.success(
            data=serializer.data,
            message="Tugas berhasil dikumpulkan.",
            status_code=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    @action(detail=True, methods=["patch"], url_path="grade")
    def grade(self, request, pk=None):
        """Action for Guru or Admin to grade a student submission."""
        if request.user.role not in ["admin", "guru"]:
            return StandardResponse.error(
                message="Anda tidak memiliki izin untuk menilai tugas.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        instance = self.get_object()
        if request.user.role == "guru" and instance.tugas.guru != request.user:
            return StandardResponse.error(
                message="Anda tidak memiliki izin untuk menilai tugas milik guru lain.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        grade_val = request.data.get("grade")
        feedback_val = request.data.get("feedback", "")
        
        if grade_val is None:
            return StandardResponse.error(
                message="Nilai (grade) wajib diisi.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            grade_val = int(grade_val)
        except (TypeError, ValueError):
            return StandardResponse.error(
                message="Nilai harus berupa angka.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if not 0 <= grade_val <= 100:
            return StandardResponse.error(
                message="Nilai harus berada di antara 0 dan 100.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
            
        instance.grade = grade_val
        instance.feedback = feedback_val
        instance.save()
        
        serializer = self.get_serializer(instance)
        return StandardResponse.success(
            data=serializer.data,
            message="Tugas berhasil dinilai."
        )


class FileUploadView(APIView):
    """API View to handle general file uploads and return absolute URLs."""
    parser_classes = (MultiPartParser, FormParser)
    permission_classes = [IsAuthenticated]
    throttle_classes = [RuntimeScopedRateThrottle]
    throttle_scope = "upload"

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return StandardResponse.error(
                message="Tidak ada berkas yang diunggah.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if file_obj.size <= 0:
            return StandardResponse.error(
                message="Berkas yang diunggah kosong.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if file_obj.size > settings.MAX_UPLOAD_SIZE:
            return StandardResponse.error(
                message="Ukuran berkas maksimal 10MB.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        extension = os.path.splitext(file_obj.name)[1].lower()
        allowed_content_types = ALLOWED_UPLOAD_TYPES.get(extension)
        if (
            not allowed_content_types
            or file_obj.content_type not in allowed_content_types
            or not has_allowed_file_signature(file_obj, extension)
        ):
            return StandardResponse.error(
                message="Tipe berkas tidak didukung.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
            
        try:
            safe_name = get_valid_filename(os.path.basename(file_obj.name))
        except ValueError:
            return StandardResponse.error(
                message="Nama berkas tidak valid.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        file_name = default_storage.get_available_name(
            os.path.join("uploads", safe_name)
        )
        saved_path = default_storage.save(file_name, file_obj)
        absolute_url = request.build_absolute_uri(default_storage.url(saved_path))
        
        return StandardResponse.success(
            data={"fileUrl": absolute_url},
            message="Berkas berhasil diunggah."
        )
