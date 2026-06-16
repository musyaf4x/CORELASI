from django.urls import path, include
from rest_framework.routers import SimpleRouter
from academic.views import (
    TahunAjaranViewSet,
    SemesterViewSet,
    KelasViewSet,
    MataPelajaranViewSet,
)

router = SimpleRouter()
router.register("tahun-ajaran", TahunAjaranViewSet, basename="tahun-ajaran")
router.register("semester", SemesterViewSet, basename="semester")
router.register("kelas", KelasViewSet, basename="kelas")
router.register("mapel", MataPelajaranViewSet, basename="mapel")

app_name = "academic"

urlpatterns = [
    path("", include(router.urls)),
]
