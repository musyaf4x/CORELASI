from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth import get_user_model

from academic.models import Kelas
from attendance.models import AbsensiSiswa
from learning.models import Tugas, Submission
from journals.models import JurnalPertemuan
from shared.responses import StandardResponse
from shared.access import is_duty_teacher, teacher_class_ids

User = get_user_model()

class IsAdminOrGuru(IsAuthenticated):
    """Permission class to restrict report access to Admin and Guru roles."""
    def has_permission(self, request, view):
        is_auth = super().has_permission(request, view)
        if not is_auth:
            return False
        return request.user.role in ["admin", "guru"]


class AttendanceReportView(APIView):
    """API View to aggregate student attendance summaries."""
    permission_classes = [IsAdminOrGuru]

    def get(self, request):
        kelas_id = request.query_params.get("kelasId")
        
        students = User.objects.filter(role="siswa").select_related("kelas")
        if request.user.role == "guru" and not is_duty_teacher(request.user):
            students = students.filter(kelas_id__in=teacher_class_ids(request.user))
        if kelas_id:
            students = students.filter(kelas_id=kelas_id)

        reports = []
        for student in students:
            records = AbsensiSiswa.objects.filter(siswa=student)
            
            hadir = 0
            sakit = 0
            izin = 0
            alpa = 0
            
            for r in records:
                stat = r.status.lower()
                if stat == "hadir":
                    hadir += 1
                elif stat == "sakit":
                    sakit += 1
                elif stat == "izin":
                    izin += 1
                elif stat == "alpa":
                    alpa += 1
            
            total = hadir + sakit + izin + alpa
            percentage = int(round((hadir / total) * 100)) if total > 0 else 0
            
            reports.append({
                "siswaId": student.id,
                "siswaName": student.name,
                "nis": student.nip_or_nis or "",
                "gender": student.gender or "-",
                "kelasName": student.kelas.name if student.kelas else "",
                "hadir": hadir,
                "sakit": sakit,
                "izin": izin,
                "alpa": alpa,
                "percentage": percentage
            })
            
        return StandardResponse.success(data=reports)


class GradeReportView(APIView):
    """API View to compile student grade summaries."""
    permission_classes = [IsAdminOrGuru]

    def get(self, request):
        kelas_id = request.query_params.get("kelasId")
        
        students = User.objects.filter(role="siswa").select_related("kelas")
        if request.user.role == "guru":
            students = students.filter(kelas_id__in=teacher_class_ids(request.user))
        if kelas_id:
            students = students.filter(kelas_id=kelas_id)

        reports = []
        for student in students:
            if not student.kelas:
                continue
                
            class_tugas = Tugas.objects.filter(kelas=student.kelas, status="Dipublikasikan").select_related("mapel")
            
            grades = []
            scored_grades = []
            
            for tugas in class_tugas:
                sub = Submission.objects.filter(tugas=tugas, siswa=student).first()
                score = sub.grade if sub else None
                feedback = sub.feedback if sub else None
                
                grades.append({
                    "tugasId": tugas.id,
                    "tugasTitle": tugas.title,
                    "mapelName": tugas.mapel.name,
                    "score": score,
                    "feedback": feedback
                })
                
                if score is not None:
                    scored_grades.append(score)
            
            average = (
                int(round(sum(scored_grades) / len(scored_grades)))
                if scored_grades
                else 0
            )
                    
            reports.append({
                "siswaId": student.id,
                "siswaName": student.name,
                "nis": student.nip_or_nis or "",
                "gender": student.gender or "-",
                "kelasName": student.kelas.name,
                "grades": grades,
                "average": average
            })
            
        return StandardResponse.success(data=reports)


class OperationalReportView(APIView):
    """API View to compile high-level school operational metrics."""
    permission_classes = [IsAdminOrGuru]

    def get(self, request):
        if request.user.role != "admin":
            return StandardResponse.error(
                message="Laporan operasional hanya dapat diakses Admin.",
                status_code=status.HTTP_403_FORBIDDEN,
            )

        # 1. Total counts
        total_siswa = User.objects.filter(role="siswa").count()
        total_guru = User.objects.filter(role="guru").count()
        total_kelas = Kelas.objects.count()
        
        # 2. Attendance rate (average of all student percentages)
        students = User.objects.filter(role="siswa")
        att_percentages = []
        for student in students:
            records = AbsensiSiswa.objects.filter(siswa=student)
            hadir = 0
            sakit = 0
            izin = 0
            alpa = 0
            for r in records:
                stat = r.status.lower()
                if stat == "hadir":
                    hadir += 1
                elif stat == "sakit":
                    sakit += 1
                elif stat == "izin":
                    izin += 1
                elif stat == "alpa":
                    alpa += 1
            total = hadir + sakit + izin + alpa
            percentage = (hadir / total) * 100 if total > 0 else 0
            att_percentages.append(percentage)
            
        attendance_rate = round(sum(att_percentages) / len(att_percentages), 1) if len(att_percentages) > 0 else 0.0
        
        # 3. Journal completion rate (completed journals vs weekly target of 15)
        journal_count = JurnalPertemuan.objects.count()
        journal_completion_rate = min(100.0, round((journal_count / 15) * 100, 1))
        # 4. Assignments and Submissions metrics
        active_assignments = Tugas.objects.filter(status="Dipublikasikan").count()
        total_submissions = Submission.objects.count()
        
        graded_submissions = Submission.objects.filter(grade__isnull=False).count()
        graded_submissions_percent = int(round((graded_submissions / total_submissions) * 100)) if total_submissions > 0 else 0
        
        return StandardResponse.success(data={
            "totalSiswa": total_siswa,
            "totalGuru": total_guru,
            "totalKelas": total_kelas,
            "attendanceRate": attendance_rate,
            "journalCompletionRate": journal_completion_rate,
            "activeAssignments": active_assignments,
            "totalSubmissions": total_submissions,
            "gradedSubmissionsPercent": graded_submissions_percent
        })
