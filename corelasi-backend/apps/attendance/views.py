from django.db import transaction
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import BasePermission, SAFE_METHODS, IsAuthenticated

from attendance.models import AbsensiSiswa, PermintaanKoreksi, StatusKehadiran
from attendance.serializers import AbsensiSiswaSerializer, PermintaanKoreksiSerializer
from shared.responses import StandardResponse
from academic.models import Kelas, MataPelajaran
from accounts.models import User
from shared.access import can_teach_subject, is_duty_teacher, teacher_class_ids

class IsAdminOrGuruOrReadOnly(BasePermission):
    """Permission class. Safe methods are open to all authenticated users; writes are restricted to Admin/Guru."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role in ["admin", "guru"]


class AbsensiSiswaViewSet(viewsets.ModelViewSet):
    """ViewSet to manage AbsensiSiswa records."""
    queryset = AbsensiSiswa.objects.all().select_related("siswa", "kelas", "mapel")
    serializer_class = AbsensiSiswaSerializer
    permission_classes = [IsAuthenticated, IsAdminOrGuruOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.role == "siswa":
            queryset = queryset.filter(siswa=user)
        elif user.role == "guru" and not is_duty_teacher(user):
            queryset = queryset.filter(kelas_id__in=teacher_class_ids(user))

        kelas_id = self.request.query_params.get("kelasId")
        tanggal = self.request.query_params.get("tanggal")
        mapel_id = self.request.query_params.get("mapelId")

        if kelas_id:
            queryset = queryset.filter(kelas_id=kelas_id)
        if tanggal:
            queryset = queryset.filter(tanggal=tanggal)
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
        if request.user.role == "guru" and not can_teach_subject(
            request.user,
            data.get("kelasId"),
            data.get("mapelId"),
        ):
            return StandardResponse.error(
                message="Anda tidak memiliki akses ke kelas dan mata pelajaran tersebut.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        serializer = self.get_serializer(data=data)
        try:
            serializer.is_valid(raise_exception=True)
            if serializer.validated_data["siswa"].kelas_id != serializer.validated_data["kelas"].id:
                raise ValidationError(
                    {"siswaId": "Siswa tidak terdaftar pada kelas yang dipilih."}
                )
            self.perform_create(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Data absensi berhasil ditambahkan.",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Gagal menambahkan data absensi.",
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=["post"], url_path="batch")
    def batch(self, request):
        """Action to perform bulk submission / updates of classroom attendance."""
        if request.user.role not in ["admin", "guru"]:
            return StandardResponse.error(
                message="Anda tidak memiliki izin untuk mengunggah absensi.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        records_data = request.data
        if not isinstance(records_data, list):
            return StandardResponse.error(
                message="Payload harus berupa list data absensi.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        if request.user.role == "guru":
            for record in records_data:
                kelas_id = record.get("kelasId") if isinstance(record, dict) else None
                mapel_id = record.get("mapelId") if isinstance(record, dict) else None
                if not can_teach_subject(request.user, kelas_id, mapel_id):
                    return StandardResponse.error(
                        message="Anda tidak memiliki akses ke salah satu kelas dan mata pelajaran absensi.",
                        status_code=status.HTTP_403_FORBIDDEN,
                    )

        updated_records = []
        try:
            with transaction.atomic():
                for rec in records_data:
                    # Validate fields via serializer on each dict
                    serializer = self.get_serializer(data=rec)
                    serializer.is_valid(raise_exception=True)
                    val_data = serializer.validated_data

                    siswa = val_data["siswa"]
                    kelas = val_data["kelas"]
                    mapel = val_data.get("mapel", None)
                    tanggal = val_data["tanggal"]
                    status_val = val_data["status"]
                    keterangan = val_data.get("keterangan", "")

                    if siswa.kelas_id != kelas.id:
                        raise ValidationError(
                            {"siswaId": "Siswa tidak terdaftar pada kelas yang dipilih."}
                        )

                    obj, created = AbsensiSiswa.objects.update_or_create(
                        siswa=siswa,
                        kelas=kelas,
                        mapel=mapel,
                        tanggal=tanggal,
                        defaults={
                            "status": status_val,
                            "keterangan": keterangan
                        }
                    )
                    updated_records.append(obj)

            # Return newly updated queryset
            serializer_out = self.get_serializer(updated_records, many=True)
            return StandardResponse.success(
                data=serializer_out.data,
                message="Batch absensi berhasil disimpan."
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Gagal menyimpan batch absensi.",
                errors=errors if errors else str(e),
                status_code=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=["patch"], url_path="override")
    def override(self, request, pk=None):
        """Action for Admin to forcefully override attendance records."""
        if request.user.role != "admin":
            return StandardResponse.error(
                message="Anda tidak memiliki izin untuk melakukan override absensi.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        instance = self.get_object()
        status_baru = request.data.get("statusBaru")
        alasan = request.data.get("alasanOverride", "")

        if not status_baru or status_baru not in StatusKehadiran.values:
            return StandardResponse.error(
                message="Status baru tidak valid atau kosong.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        # Set status_awal if not already tracked
        if not instance.status_awal:
            instance.status_awal = instance.status

        instance.status = status_baru
        instance.keterangan = f"Override Admin: {alasan}"
        instance.save()

        serializer = self.get_serializer(instance)
        return StandardResponse.success(
            data=serializer.data,
            message="Absensi berhasil di-override oleh Admin."
        )


class PermintaanKoreksiViewSet(viewsets.ModelViewSet):
    """ViewSet to manage PermintaanKoreksi records."""
    queryset = PermintaanKoreksi.objects.all().select_related("siswa", "kelas")
    serializer_class = PermintaanKoreksiSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == "siswa":
            return PermintaanKoreksi.objects.filter(siswa=user)
        if user.role == "guru" and not is_duty_teacher(user):
            return PermintaanKoreksi.objects.filter(
                kelas_id__in=teacher_class_ids(user)
            )
        return PermintaanKoreksi.objects.all()

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return StandardResponse.success(data=serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return StandardResponse.success(data=serializer.data)

    def create(self, request, *args, **kwargs):
        if request.user.role == "siswa":
            if not request.user.kelas_id:
                return StandardResponse.error(
                    message="Siswa belum memiliki kelas aktif.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            requested_class = request.data.get("kelasId")
            if requested_class not in (
                None,
                request.user.kelas_id,
                str(request.user.kelas_id),
            ):
                return StandardResponse.error(
                    message="Kelas permintaan koreksi tidak sesuai dengan kelas siswa.",
                    status_code=status.HTTP_400_BAD_REQUEST,
                )
            request.data["kelasId"] = request.user.kelas_id
            request.data["siswaId"] = request.user.id
            
        serializer = self.get_serializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            return StandardResponse.success(
                data=serializer.data,
                message="Permintaan koreksi absensi berhasil diajukan.",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            errors = getattr(e, "detail", None)
            return StandardResponse.error(
                message="Gagal mengajukan permintaan koreksi.",
                errors=errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=["patch"], url_path="verify")
    def verify(self, request, pk=None):
        """Action for Guru Piket or Admin to verify/approve a correction request."""
        if request.user.role != "admin" and not is_duty_teacher(request.user):
            return StandardResponse.error(
                message="Anda tidak memiliki izin untuk memverifikasi koreksi.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        koreksi = self.get_object()
        if koreksi.verified:
            return StandardResponse.error(
                message="Permintaan koreksi ini sudah diverifikasi.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        status_koreksi = request.data.get("statusKoreksi", koreksi.status_koreksi)
        keterangan = request.data.get("keterangan", koreksi.keterangan)

        if status_koreksi not in StatusKehadiran.values:
            return StandardResponse.error(
                message="Status koreksi tidak valid.",
                status_code=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            # Update PermintaanKoreksi record
            koreksi.status_koreksi = status_koreksi
            koreksi.keterangan = keterangan
            koreksi.verified = True
            koreksi.save()

            # Locate or create the matching AbsensiSiswa record to apply the fix
            absensi = AbsensiSiswa.objects.filter(
                siswa=koreksi.siswa,
                kelas=koreksi.kelas,
                tanggal=koreksi.tanggal
            ).first()

            if absensi:
                absensi.status = status_koreksi
                absensi.keterangan = f"Koreksi disetujui: {keterangan}"
                absensi.save()
            else:
                AbsensiSiswa.objects.create(
                    siswa=koreksi.siswa,
                    kelas=koreksi.kelas,
                    tanggal=koreksi.tanggal,
                    status=status_koreksi,
                    keterangan=f"Koreksi disetujui: {keterangan}"
                )

        return StandardResponse.success(
            message="Permintaan koreksi berhasil disetujui dan diperbarui ke absensi siswa."
        )
