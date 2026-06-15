from rest_framework import viewsets, status, permissions
from rest_framework.permissions import BasePermission, SAFE_METHODS, IsAuthenticated

from journals.models import JurnalPertemuan
from journals.serializers import JurnalPertemuanSerializer
from shared.responses import StandardResponse
from shared.access import can_teach_subject, teacher_class_ids

class IsAdminOrGuruOrReadOnly(BasePermission):
    """Permission class. Safe methods are open to all authenticated users; writes are restricted to Admin/Guru."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.role in ["admin", "guru"]


class IsOwnerOrAdmin(BasePermission):
    """Permission class. Only the owner (guru) or admin can modify/delete the object."""
    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.role == "admin":
            return True
        if hasattr(obj, "guru"):
            return obj.guru == request.user
        return False


class JurnalPertemuanViewSet(viewsets.ModelViewSet):
    """ViewSet to manage meetings/teaching journals (JurnalPertemuan)."""
    queryset = JurnalPertemuan.objects.all().select_related("kelas", "mapel", "guru")
    serializer_class = JurnalPertemuanSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGuruOrReadOnly, IsOwnerOrAdmin]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.user.role == "guru":
            from django.db.models import Q

            queryset = queryset.filter(
                Q(guru=self.request.user)
                | Q(kelas_id__in=teacher_class_ids(self.request.user))
            ).distinct()

        kelas_id = self.request.query_params.get("kelasId")
        guru_id = self.request.query_params.get("guruId")

        if kelas_id:
            queryset = queryset.filter(kelas_id=kelas_id)
        if guru_id:
            queryset = queryset.filter(guru_id=guru_id)

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
                    message="Anda tidak memiliki akses ke kelas dan mata pelajaran jurnal tersebut.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            data["guruId"] = request.user.id

        serializer = self.get_serializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Jurnal pertemuan berhasil dicatat.",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Gagal mencatat jurnal pertemuan.",
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
                    message="Anda tidak memiliki akses ke kelas dan mata pelajaran jurnal tersebut.",
                    status_code=status.HTTP_403_FORBIDDEN,
                )
            data["guruId"] = request.user.id
        serializer = self.get_serializer(instance, data=data, partial=partial)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Jurnal pertemuan berhasil diperbarui."
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Gagal memperbarui jurnal pertemuan.",
                errors=errors if errors else str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return StandardResponse.success(
            message="Jurnal pertemuan berhasil dihapus."
        )
