from django.db.models import Q, QuerySet
from django.utils import timezone


DAY_NAMES = (
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
)


def teacher_class_ids(user) -> set[int]:
    if not user.is_authenticated or user.role != "guru":
        return set()

    from academic.models import Kelas
    from schedules.models import JadwalPelajaran

    taught_ids = JadwalPelajaran.objects.filter(guru=user).values_list(
        "kelas_id", flat=True
    )
    homeroom_ids = Kelas.objects.filter(wali_kelas=user).values_list("id", flat=True)
    return set(taught_ids).union(homeroom_ids)


def is_duty_teacher(user) -> bool:
    if not user.is_authenticated or user.role != "guru":
        return False
    if user.is_piket_today:
        return True

    from schedules.models import JadwalPiket

    today_name = DAY_NAMES[timezone.localdate().weekday()]
    return JadwalPiket.objects.filter(
        guru=user,
        hari=today_name,
        semester__status="aktif",
    ).exists()


def scope_users_for(user, queryset: QuerySet) -> QuerySet:
    if user.role == "admin":
        return queryset
    if user.role == "guru":
        return queryset.filter(
            Q(id=user.id)
            | Q(role="siswa", kelas_id__in=teacher_class_ids(user))
        ).distinct()
    return queryset.filter(id=user.id)


def can_access_class(user, kelas_id: int | str | None) -> bool:
    if kelas_id is None or not user.is_authenticated:
        return False
    try:
        normalized_id = int(kelas_id)
    except (TypeError, ValueError):
        return False
    if user.role == "admin":
        return True
    if user.role == "siswa":
        return user.kelas_id == normalized_id
    if user.role == "guru":
        return normalized_id in teacher_class_ids(user)
    return False


def can_teach_subject(
    user,
    kelas_id: int | str | None,
    mapel_id: int | str | None,
) -> bool:
    if not user.is_authenticated:
        return False
    if user.role == "admin":
        return True
    if user.role != "guru" or kelas_id is None or mapel_id is None:
        return False

    try:
        normalized_class_id = int(kelas_id)
        normalized_subject_id = int(mapel_id)
    except (TypeError, ValueError):
        return False

    from schedules.models import JadwalPelajaran

    return JadwalPelajaran.objects.filter(
        guru=user,
        kelas_id=normalized_class_id,
        mapel_id=normalized_subject_id,
        semester__status="aktif",
    ).exists()
