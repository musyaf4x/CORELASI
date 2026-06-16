from rest_framework import serializers
from academic.models import TahunAjaran, Semester, Kelas, MataPelajaran
from accounts.models import User

class TahunAjaranSerializer(serializers.ModelSerializer):
    """Serializer mapping TahunAjaran model to frontend camelCase expectations."""
    tanggalMulai = serializers.DateField(source="tanggal_mulai", required=False, allow_null=True)
    tanggalSelesai = serializers.DateField(source="tanggal_selesai", required=False, allow_null=True)

    class Meta:
        model = TahunAjaran
        fields = ("id", "name", "status", "tanggalMulai", "tanggalSelesai")


class SemesterSerializer(serializers.ModelSerializer):
    """Serializer mapping Semester model with Year-name binding and camelCase dates."""
    tahunAjaran = serializers.CharField(source="tahun_ajaran.name")
    tanggalMulai = serializers.DateField(source="tanggal_mulai", required=False, allow_null=True)
    tanggalSelesai = serializers.DateField(source="tanggal_selesai", required=False, allow_null=True)

    class Meta:
        model = Semester
        fields = ("id", "name", "tahunAjaran", "status", "tanggalMulai", "tanggalSelesai")

    def validate(self, attrs):
        # Resolve tahun_ajaran
        ta_data = attrs.get("tahun_ajaran")
        if ta_data:
            try:
                ta = TahunAjaran.objects.get(name=ta_data["name"])
            except TahunAjaran.DoesNotExist:
                raise serializers.ValidationError({"tahunAjaran": f"Tahun Ajaran '{ta_data['name']}' tidak ditemukan."})
        elif self.instance:
            ta = self.instance.tahun_ajaran
        else:
            ta = None

        name = attrs.get("name", self.instance.name if self.instance else None)
        # Handle field mappings for dates
        tanggal_mulai = attrs.get("tanggal_mulai", self.instance.tanggal_mulai if self.instance else None)
        tanggal_selesai = attrs.get("tanggal_selesai", self.instance.tanggal_selesai if self.instance else None)

        if tanggal_mulai and tanggal_selesai:
            if tanggal_mulai > tanggal_selesai:
                raise serializers.ValidationError({"tanggalMulai": "Tanggal mulai tidak boleh setelah tanggal selesai."})

            if ta:
                if tanggal_mulai < ta.tanggal_mulai or tanggal_selesai > ta.tanggal_selesai:
                    raise serializers.ValidationError({
                        "tanggalMulai": f"Tanggal semester harus berada di dalam rentang tahun ajaran ({ta.tanggal_mulai} s.d. {ta.tanggal_selesai})."
                    })

                # Check overlap with other semesters in the same TahunAjaran
                exclude_id = self.instance.id if self.instance else None
                other_semesters = Semester.objects.filter(tahun_ajaran=ta)
                if exclude_id:
                    other_semesters = other_semesters.exclude(id=exclude_id)
                for other in other_semesters:
                    if other.tanggal_mulai and other.tanggal_selesai:
                        if tanggal_mulai <= other.tanggal_selesai and other.tanggal_mulai <= tanggal_selesai:
                            raise serializers.ValidationError({
                                "tanggalMulai": f"Tanggal semester tumpang tindih dengan semester {other.name} ({other.tanggal_mulai} s.d. {other.tanggal_selesai})."
                            })
        return attrs

    def create(self, validated_data):
        ta_data = validated_data.pop("tahun_ajaran")
        try:
            ta = TahunAjaran.objects.get(name=ta_data["name"])
        except TahunAjaran.DoesNotExist:
            raise serializers.ValidationError({"tahunAjaran": f"Tahun Ajaran '{ta_data['name']}' tidak ditemukan."})
        return Semester.objects.create(tahun_ajaran=ta, **validated_data)

    def update(self, instance, validated_data):
        if "tahun_ajaran" in validated_data:
            ta_data = validated_data.pop("tahun_ajaran")
            try:
                ta = TahunAjaran.objects.get(name=ta_data["name"])
                instance.tahun_ajaran = ta
            except TahunAjaran.DoesNotExist:
                raise serializers.ValidationError({"tahunAjaran": f"Tahun Ajaran '{ta_data['name']}' tidak ditemukan."})
        return super().update(instance, validated_data)


class KelasSerializer(serializers.ModelSerializer):
    """Serializer mapping Kelas model resolving Wali Kelas and Tahun Ajaran relationships."""
    tahunAjaran = serializers.CharField(source="tahun_ajaran.name", required=False, allow_null=True)
    waliKelasId = serializers.PrimaryKeyRelatedField(
        source="wali_kelas",
        queryset=User.objects.filter(role="guru"),
        allow_null=True,
        required=False
    )
    waliKelasName = serializers.CharField(source="wali_kelas.name", read_only=True)

    class Meta:
        model = Kelas
        fields = ("id", "name", "tingkat", "waliKelasId", "waliKelasName", "tahunAjaran")

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Handle nullable wali kelas consistently with mock expectations
        if not instance.wali_kelas:
            ret["waliKelasId"] = ""
            ret["waliKelasName"] = "Belum ada wali kelas"
        ret["tahunAjaran"] = instance.tahun_ajaran.name if instance.tahun_ajaran else ""
        return ret

    def create(self, validated_data):
        ta_data = validated_data.pop("tahun_ajaran", None)
        if ta_data:
            try:
                ta = TahunAjaran.objects.get(name=ta_data["name"])
            except TahunAjaran.DoesNotExist:
                raise serializers.ValidationError({"tahunAjaran": f"Tahun Ajaran '{ta_data['name']}' tidak ditemukan."})
        else:
            ta = TahunAjaran.objects.filter(status="aktif").first() or TahunAjaran.objects.first()
            if not ta:
                raise serializers.ValidationError({"tahunAjaran": "Tahun Ajaran tidak ditemukan."})
        
        return Kelas.objects.create(tahun_ajaran=ta, **validated_data)

    def update(self, instance, validated_data):
        if "tahun_ajaran" in validated_data:
            ta_data = validated_data.pop("tahun_ajaran")
            try:
                ta = TahunAjaran.objects.get(name=ta_data["name"])
                instance.tahun_ajaran = ta
            except TahunAjaran.DoesNotExist:
                raise serializers.ValidationError({"tahunAjaran": f"Tahun Ajaran '{ta_data['name']}' tidak ditemukan."})
        return super().update(instance, validated_data)


class MataPelajaranSerializer(serializers.ModelSerializer):
    """Serializer mapping MataPelajaran model directly."""
    kode = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = MataPelajaran
        fields = ("id", "name", "kode")
