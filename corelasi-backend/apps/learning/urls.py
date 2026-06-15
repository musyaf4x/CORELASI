from django.urls import path, include
from rest_framework.routers import SimpleRouter
from learning.views import MateriViewSet, TugasViewSet, SubmissionViewSet, FileUploadView

router = SimpleRouter()
router.register("materi", MateriViewSet, basename="materi")
router.register("tugas", TugasViewSet, basename="tugas")
router.register("submissions", SubmissionViewSet, basename="submissions")

urlpatterns = [
    path("upload/", FileUploadView.as_view(), name="file-upload"),
    path("", include(router.urls)),
]
