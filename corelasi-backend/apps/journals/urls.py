from django.urls import path, include
from rest_framework.routers import SimpleRouter
from journals.views import JurnalPertemuanViewSet

router = SimpleRouter()
router.register("", JurnalPertemuanViewSet, basename="jurnal")

urlpatterns = [
    path("", include(router.urls)),
]
