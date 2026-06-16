from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated

from academic.views import IsAdminOrReadOnly
from schedules.models import JadwalPelajaran, JadwalPiket
from schedules.serializers import JadwalPelajaranSerializer, JadwalPiketSerializer
from shared.responses import StandardResponse

def get_error_message(errors, default="Gagal memproses data."):
    """Helper to extract a clean, human-readable error message from DRF validation errors."""
    if not errors:
        return default
    if isinstance(errors, dict):
        if "non_field_errors" in errors:
            return errors["non_field_errors"][0]
        # Get first list's first error
        for key, val in errors.items():
            if isinstance(val, list) and val:
                return val[0]
            if isinstance(val, dict):
                return get_error_message(val, default)
            return str(val)
    if isinstance(errors, list) and errors:
        return errors[0]
    return str(errors)


class JadwalPelajaranViewSet(viewsets.ModelViewSet):
    """ViewSet managing JadwalPelajaran CRUD with role access rules."""
    queryset = JadwalPelajaran.objects.all().select_related(
        "kelas", "mapel", "guru", "semester__tahun_ajaran"
    )
    serializer_class = JadwalPelajaranSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.role == "siswa":
            if not user.kelas:
                return JadwalPelajaran.objects.none()
            queryset = queryset.filter(kelas=user.kelas)
        elif user.role == "guru":
            queryset = queryset.filter(guru=user)

        kelas_id = self.request.query_params.get("kelasId")
        guru_id = self.request.query_params.get("guruId")
        semester_id = self.request.query_params.get("semesterId")
        hari = self.request.query_params.get("hari")

        if kelas_id:
            queryset = queryset.filter(kelas_id=kelas_id)
        if guru_id:
            queryset = queryset.filter(guru_id=guru_id)
        if semester_id:
            queryset = queryset.filter(semester_id=semester_id)
        if hari:
            queryset = queryset.filter(hari=hari)
            
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
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Jadwal pembelajaran baru berhasil ditambahkan.",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message=get_error_message(errors, "Gagal menambahkan jadwal pembelajaran."),
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
                message="Jadwal pembelajaran berhasil diperbarui."
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message=get_error_message(errors, "Gagal memperbarui jadwal pembelajaran."),
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
            return StandardResponse.success(
                message="Jadwal pembelajaran berhasil dihapus.",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return StandardResponse.error(
                message="Gagal menghapus jadwal pembelajaran.",
                status_code=status.HTTP_400_BAD_REQUEST
            )


class JadwalPiketViewSet(viewsets.ModelViewSet):
    """ViewSet managing JadwalPiket CRUD with role access rules."""
    queryset = JadwalPiket.objects.all().select_related(
        "guru", "semester__tahun_ajaran"
    )
    serializer_class = JadwalPiketSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.role == "siswa":
            return JadwalPiket.objects.none()
        if user.role == "guru":
            queryset = queryset.filter(guru=user)

        guru_id = self.request.query_params.get("guruId")
        semester_id = self.request.query_params.get("semesterId")
        hari = self.request.query_params.get("hari")

        if guru_id:
            queryset = queryset.filter(guru_id=guru_id)
        if semester_id:
            queryset = queryset.filter(semester_id=semester_id)
        if hari:
            queryset = queryset.filter(hari=hari)
            
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
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Jadwal piket baru berhasil ditambahkan.",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message=get_error_message(errors, "Gagal menambahkan jadwal piket."),
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
                message="Jadwal piket berhasil diperbarui."
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message=get_error_message(errors, "Gagal memperbarui jadwal piket."),
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        try:
            self.perform_destroy(instance)
            return StandardResponse.success(
                message="Jadwal piket berhasil dihapus.",
                status_code=status.HTTP_200_OK
            )
        except Exception as e:
            return StandardResponse.error(
                message="Gagal menghapus jadwal piket.",
                status_code=status.HTTP_400_BAD_REQUEST
            )
