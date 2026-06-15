"""Doctor-wise booking slot calculation.

Slots come from a doctor's recurring weekly DoctorAvailability rows, stepped by
slot_minutes, with any already-booked times marked unavailable.
"""
from datetime import datetime, timedelta

from django.utils import timezone

from .models import Appointment

BLOCKING_STATUSES = ["booked", "confirmed"]


def _aware(dt):
    return timezone.make_aware(dt) if timezone.is_naive(dt) else dt


def generate_slots(doctor, date):
    """Return [{time: 'HH:MM', datetime: ISO, available: bool}] for one day."""
    weekday = date.weekday()  # Monday=0 .. Sunday=6 — matches Weekday choices
    availabilities = doctor.availabilities.filter(weekday=weekday)

    booked = {
        _aware(dt)
        for dt in Appointment.objects.filter(
            doctor=doctor,
            scheduled_for__date=date,
            status__in=BLOCKING_STATUSES,
        ).values_list("scheduled_for", flat=True)
    }

    now = timezone.now()
    slots = []
    seen = set()
    for av in availabilities:
        cursor = datetime.combine(date, av.start_time)
        end = datetime.combine(date, av.end_time)
        step = timedelta(minutes=av.slot_minutes or 30)
        while cursor + step <= end:
            aware = _aware(cursor)
            key = aware.isoformat()
            if key not in seen:
                seen.add(key)
                taken = any(abs((b - aware).total_seconds()) < 60 for b in booked)
                in_past = aware <= now
                slots.append({
                    "time": cursor.strftime("%H:%M"),
                    "datetime": aware.isoformat(),
                    "available": not taken and not in_past,
                })
            cursor += step
    slots.sort(key=lambda s: s["time"])
    return slots


def is_slot_open(doctor, scheduled_for):
    """Validate a chosen datetime is a real, free, future slot for the doctor."""
    scheduled_for = _aware(scheduled_for)
    target = scheduled_for.strftime("%H:%M")
    for slot in generate_slots(doctor, scheduled_for.date()):
        if slot["time"] == target:
            return slot["available"]
    return False
