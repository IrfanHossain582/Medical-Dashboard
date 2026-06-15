"""Transactional email helpers (booking confirmations, etc.)."""
from django.conf import settings
from django.core.mail import send_mail


def send_booking_confirmation(appointment):
    """Email the patient confirming their appointment.

    Safe no-op when the patient has no email. Returns True if an email was sent.
    """
    patient = appointment.patient
    if not patient.email:
        return False

    clinic = getattr(settings, "CLINIC_NAME", "Our Clinic")
    when = appointment.scheduled_for.strftime("%A, %d %B %Y at %I:%M %p")
    location = appointment.location.name if appointment.location else clinic

    subject = f"Appointment confirmed — {clinic}"
    body = (
        f"Hi {patient.name},\n\n"
        f"Your appointment has been booked.\n\n"
        f"  Doctor:   {appointment.doctor.name}"
        f" ({appointment.doctor.specialization})\n"
        f"  Date/time: {when}\n"
        f"  Location:  {location}\n"
        f"  Reason:    {appointment.reason or '—'}\n\n"
        f"If you need to reschedule, please reply to this email or call us.\n\n"
        f"Thank you,\n{clinic}"
    )

    send_mail(
        subject,
        body,
        settings.DEFAULT_FROM_EMAIL,
        [patient.email],
        fail_silently=True,
    )
    return True
