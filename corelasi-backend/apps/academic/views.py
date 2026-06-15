from rest_framework import viewsets, status
from rest_framework.permissions import BasePermission, SAFE_METHODS, IsAuthenticated

from academic.models import TahunAjaran, Semester, Kelas, MataPelajaran
from academic.serializers import (
    TahunAjaranSerializer,
    SemesterSerializer,
    KelasSerializer,
    MataPelajaranSerializer,
)
from shared.responses import StandardResponse

class IsAdminOrReadOnly(BasePermission):
    """Custom permission class. Full access for admin, read-only for other authenticated roles."""
    
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == "admin"


class BaseAcademicViewSet(viewsets.ModelViewSet):
    """Base ViewSet wrapping CRUD responses in the StandardResponse ApiResponse envelope."""
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return StandardResponse.success(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return StandardResponse.success(data=serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Data berhasil ditambahkan.",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Gagal menambahkan data.",
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Data berhasil diperbarui."
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Gagal memperbarui data.",
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
            return StandardResponse.success(
                message="Data berhasil dihapus.",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return StandardResponse.error(
                message="Gagal menghapus data.",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class TahunAjaranViewSet(BaseAcademicViewSet):
    queryset = TahunAjaran.objects.all()
    serializer_class = TahunAjaranSerializer


class SemesterViewSet(BaseAcademicViewSet):
    queryset = Semester.objects.all().select_related("tahun_ajaran")
    serializer_class = SemesterSerializer


class KelasViewSet(BaseAcademicViewSet):
    queryset = Kelas.objects.all().select_related("wali_kelas")
    serializer_class = KelasSerializer


class MataPelajaranViewSet(BaseAcademicViewSet):
    queryset = MataPelajaran.objects.all()
    serializer_class = MataPelajaranSerializer
