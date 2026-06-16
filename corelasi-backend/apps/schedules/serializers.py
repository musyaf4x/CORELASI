from rest_framework import serializers
from schedules.models import JadwalPelajaran, JadwalPiket
from academic.models import Kelas, MataPelajaran, Semester
from accounts.models import User

class JadwalPelajaranSerializer(serializers.ModelSerializer):
    """Serializer mapping JadwalPelajaran model to frontend camelCase expectations with conflict checks."""
    kelasId = serializers.PrimaryKeyRelatedField(
        source="kelas",
        queryset=Kelas.objects.all()
    )
    kelasName = serializers.CharField(source="kelas.name", read_only=True)
    mapelId = serializers.PrimaryKeyRelatedField(
        source="mapel",
        queryset=MataPelajaran.objects.all()
    )
    mapelName = serializers.CharField(source="mapel.name", read_only=True)
    guruId = serializers.PrimaryKeyRelatedField(
        source="guru",
        queryset=User.objects.filter(role="guru")
    )
    guruName = serializers.CharField(source="guru.name", read_only=True)
    waktuMulai = serializers.TimeField(source="waktu_mulai", format="%H:%M")
    waktuSelesai = serializers.TimeField(source="waktu_selesai", format="%H:%M")
    semesterId = serializers.PrimaryKeyRelatedField(
        source="semester",
        queryset=Semester.objects.all()
    )
    tahunAjaranId = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = JadwalPelajaran
        fields = (
            "id", "kelasId", "kelasName", "mapelId", "mapelName",
            "guruId", "guruName", "hari", "waktuMulai", "waktuSelesai",
            "semesterId", "tahunAjaranId"
        )

    def get_tahunAjaranId(self, obj):
        return obj.semester.tahun_ajaran.name if obj.semester and obj.semester.tahun_ajaran else None

    def validate(self, attrs):
        # Retrieve values (supporting both create and partial update validations)
        kelas = attrs.get("kelas", self.instance.kelas if self.instance else None)
        guru = attrs.get("guru", self.instance.guru if self.instance else None)
        semester = attrs.get("semester", self.instance.semester if self.instance else None)
        hari = attrs.get("hari", self.instance.hari if self.instance else None)
        waktu_mulai = attrs.get("waktu_mulai", self.instance.waktu_mulai if self.instance else None)
        waktu_selesai = attrs.get("waktu_selesai", self.instance.waktu_selesai if self.instance else None)

        if not (kelas and guru and semester and hari and waktu_mulai and waktu_selesai):
            raise serializers.ValidationError("Semua bidang wajib diisi.")

        if waktu_mulai >= waktu_selesai:
            raise serializers.ValidationError({
                "waktuMulai": "Waktu mulai harus sebelum waktu selesai."
            })

        # 1. Check classroom overlap on the same day & semester
        overlapping_kelas = JadwalPelajaran.objects.filter(
            semester=semester,
            hari=hari,
            kelas=kelas,
            waktu_mulai__lt=waktu_selesai,
            waktu_selesai__gt=waktu_mulai
        )
        if self.instance:
            overlapping_kelas = overlapping_kelas.exclude(id=self.instance.id)
        if overlapping_kelas.exists():
            raise serializers.ValidationError(
                "Kelas tersebut sudah memiliki jadwal pelajaran lain pada waktu yang bersamaan."
            )

        # 2. Check teacher overlap on the same day & semester
        overlapping_guru = JadwalPelajaran.objects.filter(
            semester=semester,
            hari=hari,
            guru=guru,
            waktu_mulai__lt=waktu_selesai,
            waktu_selesai__gt=waktu_mulai
        )
        if self.instance:
            overlapping_guru = overlapping_guru.exclude(id=self.instance.id)
        if overlapping_guru.exists():
            raise serializers.ValidationError(
                "Guru tersebut sudah memiliki jadwal mengajar lain pada waktu yang bersamaan."
            )

        return attrs


class JadwalPiketSerializer(serializers.ModelSerializer):
    """Serializer mapping JadwalPiket model to camelCase expectations with duplication guards."""
    guruId = serializers.PrimaryKeyRelatedField(
        source="guru",
        queryset=User.objects.filter(role="guru")
    )
    guruName = serializers.CharField(source="guru.name", read_only=True)
    semesterId = serializers.PrimaryKeyRelatedField(
        source="semester",
        queryset=Semester.objects.all()
    )
    tahunAjaranId = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = JadwalPiket
        fields = (
            "id", "guruId", "guruName", "hari", "semesterId", "tahunAjaranId"
        )

    def get_tahunAjaranId(self, obj):
        return obj.semester.tahun_ajaran.name if obj.semester and obj.semester.tahun_ajaran else None

    def validate(self, attrs):
        guru = attrs.get("guru", self.instance.guru if self.instance else None)
        hari = attrs.get("hari", self.instance.hari if self.instance else None)
        semester = attrs.get("semester", self.instance.semester if self.instance else None)

        if not (guru and hari and semester):
            raise serializers.ValidationError("Semua bidang wajib diisi.")

        # 3. Check duplication for the same teacher on the same day in the same semester
        duplicate = JadwalPiket.objects.filter(
            semester=semester,
            hari=hari,
            guru=guru
        )
        if self.instance:
            duplicate = duplicate.exclude(id=self.instance.id)
        if duplicate.exists():
            raise serializers.ValidationError(
                "Guru tersebut sudah dijadwalkan piket pada hari yang sama di semester terpilih."
            )

        return attrs
