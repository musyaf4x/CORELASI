from rest_framework import serializers
from learning.models import Materi, Tugas, Submission
from academic.models import Kelas, MataPelajaran
from accounts.models import User

class MateriSerializer(serializers.ModelSerializer):
    sourceType = serializers.ChoiceField(source="source_type", choices=Materi.SourceType.choices)
    fileUrl = serializers.CharField(source="file_url", required=False, allow_null=True, allow_blank=True)
    dateCreated = serializers.DateField(source="date_created", read_only=True)
    kelasId = serializers.PrimaryKeyRelatedField(source="kelas", queryset=Kelas.objects.all())
    kelasName = serializers.CharField(source="kelas.name", read_only=True)
    mapelId = serializers.PrimaryKeyRelatedField(source="mapel", queryset=MataPelajaran.objects.all())
    mapelName = serializers.CharField(source="mapel.name", read_only=True)
    guruId = serializers.PrimaryKeyRelatedField(
        source="guru", queryset=User.objects.filter(role="guru")
    )
    guruName = serializers.CharField(source="guru.name", read_only=True)

    class Meta:
        model = Materi
        fields = (
            "id", "title", "description", "sourceType", "fileUrl", "dateCreated",
            "kelasId", "kelasName", "mapelId", "mapelName", "guruId", "guruName", "status"
        )


class TugasSerializer(serializers.ModelSerializer):
    fileUrl = serializers.CharField(source="file_url", required=False, allow_null=True, allow_blank=True)
    dueDate = serializers.DateField(source="due_date")
    dateCreated = serializers.DateField(source="date_created", read_only=True)
    kelasId = serializers.PrimaryKeyRelatedField(source="kelas", queryset=Kelas.objects.all())
    kelasName = serializers.CharField(source="kelas.name", read_only=True)
    mapelId = serializers.PrimaryKeyRelatedField(source="mapel", queryset=MataPelajaran.objects.all())
    mapelName = serializers.CharField(source="mapel.name", read_only=True)
    guruId = serializers.PrimaryKeyRelatedField(
        source="guru", queryset=User.objects.filter(role="guru")
    )
    guruName = serializers.CharField(source="guru.name", read_only=True)

    class Meta:
        model = Tugas
        fields = (
            "id", "title", "description", "fileUrl", "dueDate", "dateCreated",
            "kelasId", "kelasName", "mapelId", "mapelName", "guruId", "guruName", "status"
        )


class SubmissionSerializer(serializers.ModelSerializer):
    tugasId = serializers.PrimaryKeyRelatedField(source="tugas", queryset=Tugas.objects.all())
    siswaId = serializers.PrimaryKeyRelatedField(
        source="siswa", queryset=User.objects.filter(role="siswa")
    )
    siswaName = serializers.CharField(source="siswa.name", read_only=True)
    submitDate = serializers.DateField(source="submit_date", read_only=True)
    fileUrl = serializers.CharField(source="file_url", required=False, allow_null=True, allow_blank=True)
    status = serializers.CharField(read_only=True)

    class Meta:
        model = Submission
        fields = (
            "id", "tugasId", "siswaId", "siswaName", "submitDate", "fileUrl",
            "status", "grade", "feedback"
        )
