from rest_framework import serializers
from journals.models import JurnalPertemuan
from academic.models import Kelas, MataPelajaran
from accounts.models import User

class JurnalPertemuanSerializer(serializers.ModelSerializer):
    kelasId = serializers.PrimaryKeyRelatedField(source="kelas", queryset=Kelas.objects.all())
    kelasName = serializers.CharField(source="kelas.name", read_only=True)
    mapelId = serializers.PrimaryKeyRelatedField(source="mapel", queryset=MataPelajaran.objects.all())
    mapelName = serializers.CharField(source="mapel.name", read_only=True)
    guruId = serializers.PrimaryKeyRelatedField(
        source="guru", queryset=User.objects.filter(role="guru")
    )
    guruName = serializers.CharField(source="guru.name", read_only=True)
    materialSummary = serializers.CharField(source="material_summary")
    presentCount = serializers.IntegerField(source="present_count")
    absentCount = serializers.IntegerField(source="absent_count")

    class Meta:
        model = JurnalPertemuan
        fields = (
            "id", "date", "kelasId", "kelasName", "mapelId", "mapelName",
            "guruId", "guruName", "agenda", "materialSummary", "presentCount",
            "absentCount", "notes"
        )
