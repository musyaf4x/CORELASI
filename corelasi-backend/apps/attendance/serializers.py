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
