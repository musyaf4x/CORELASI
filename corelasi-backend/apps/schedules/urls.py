from django.urls import path, include
from rest_framework.routers import SimpleRouter
from schedules.views import JadwalPelajaranViewSet, JadwalPiketViewSet

app_name = "schedules"

router = SimpleRouter()
router.register("pembelajaran", JadwalPelajaranViewSet, basename="pembelajaran")
router.register("piket", JadwalPiketViewSet, basename="piket")

urlpatterns = [
    path("", include(router.urls)),
]
