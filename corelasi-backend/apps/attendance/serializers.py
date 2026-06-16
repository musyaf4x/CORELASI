from rest_framework import serializers
from attendance.models import AbsensiSiswa, PermintaanKoreksi
from academic.models import Kelas, MataPelajaran
from accounts.models import User

class AbsensiSiswaSerializer(serializers.ModelSerializer):
    """Serializer mapping AbsensiSiswa model to camelCase expectations."""
    siswaId = serializers.PrimaryKeyRelatedField(
        source="siswa",
        queryset=User.objects.filter(role="siswa")
    )
    siswaName = serializers.CharField(source="siswa.name", read_only=True)
    nis = serializers.CharField(source="siswa.nip_or_nis", read_only=True)
    kelasId = serializers.PrimaryKeyRelatedField(
        source="kelas",
        queryset=Kelas.objects.all()
    )
    kelasName = serializers.CharField(source="kelas.name", read_only=True)
    mapelId = serializers.PrimaryKeyRelatedField(
        source="mapel",
        queryset=MataPelajaran.objects.all(),
        required=False,
        allow_null=True
    )
    mapelName = serializers.CharField(source="mapel.name", read_only=True)
    statusAwal = serializers.CharField(source="status_awal", read_only=True)

    class Meta:
        model = AbsensiSiswa
        fields = (
            "id", "siswaId", "siswaName", "nis", "kelasId", "kelasName",
            "mapelId", "mapelName", "tanggal", "status", "statusAwal", "keterangan"
        )

    def validate(self, attrs):
        request = self.context.get("request")
        if request and request.user:
            user = request.user
            from shared.access import is_duty_teacher
            if user.role == "guru" and not is_duty_teacher(user):
                status_val = attrs.get("status")
                existing_obj = self.instance

                # If trying to set/update status to Sakit or Izin
                if status_val in ["Sakit", "Izin"]:
                    if not existing_obj or existing_obj.status != status_val:
                        raise serializers.ValidationError(
                            {"status": "Guru Pengampu tidak diperbolehkan menginput status Sakit atau Izin."}
                        )

                # If existing status is Sakit or Izin, and trying to change it
                if existing_obj and existing_obj.status in ["Sakit", "Izin"]:
                    if status_val and status_val != existing_obj.status:
                        raise serializers.ValidationError(
                            {"status": "Guru Pengampu tidak diperbolehkan mengubah status Sakit/Izin yang telah ditetapkan oleh Guru Piket/Admin."}
                        )
        return attrs


class PermintaanKoreksiSerializer(serializers.ModelSerializer):
    """Serializer mapping PermintaanKoreksi model to camelCase expectations."""
    siswaId = serializers.PrimaryKeyRelatedField(
        source="siswa",
        queryset=User.objects.filter(role="siswa")
    )
    siswaName = serializers.CharField(source="siswa.name", read_only=True)
    kelasId = serializers.PrimaryKeyRelatedField(
        source="kelas",
        queryset=Kelas.objects.all()
    )
    kelasName = serializers.CharField(source="kelas.name", read_only=True)
    mapelName = serializers.CharField(source="mapel_name")
    statusSemula = serializers.CharField(source="status_semula")
    statusKoreksi = serializers.CharField(source="status_koreksi")

    class Meta:
        model = PermintaanKoreksi
        fields = (
            "id", "siswaId", "siswaName", "kelasId", "kelasName",
            "mapelName", "statusSemula", "statusKoreksi", "keterangan",
            "verified", "tanggal"
        )
