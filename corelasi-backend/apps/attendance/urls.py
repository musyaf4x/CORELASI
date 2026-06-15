from django.urls import path, include
from rest_framework.routers import SimpleRouter
from attendance.views import AbsensiSiswaViewSet, PermintaanKoreksiViewSet

app_name = "attendance"

router = SimpleRouter()
router.register("siswa", AbsensiSiswaViewSet, basename="siswa")
router.register("koreksi", PermintaanKoreksiViewSet, basename="koreksi")

urlpatterns = [
    path("", include(router.urls)),
]
