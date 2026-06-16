from django.urls import path
from reports.views import AttendanceReportView, GradeReportView, OperationalReportView

urlpatterns = [
    path("attendance/", AttendanceReportView.as_view(), name="report-attendance"),
    path("grades/", GradeReportView.as_view(), name="report-grades"),
    path("operational/", OperationalReportView.as_view(), name="report-operational"),
]
