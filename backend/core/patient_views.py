"""Patient-facing authenticated endpoints for the website.

Patients self-register (email/password or Google), then book appointments and
send contact messages tied to their account, and view their own history.
"""
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .emails import send_booking_confirmation
from .models import Appointment, ContactMessage, Doctor, Patient
from .serializers import (
    AppointmentSerializer,
    PaymentSerializer,
    TestOrderSerializer,
)
from .slots import is_slot_open
from .public_views import BookingSerializer

User = get_user_model()


def _tokens_for(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def _ensure_patient(user, name="", phone="", email=""):
    """Get or create the Patient record linked to this user account."""
    patient = Patient.objects.filter(account=user).first()
    if patient:
        return patient
    # Reuse an existing patient by email/phone if one exists, else create.
    patient = None
    if email:
        patient = Patient.objects.filter(email=email, account__isnull=True).first()
    if not patient and phone:
        patient = Patient.objects.filter(phone=phone, account__isnull=True).first()
    if not patient:
        patient = Patient.objects.create(
            name=name or user.get_full_name() or user.username,
            email=email or user.email,
            phone=phone,
        )
    patient.account = user
    patient.save(update_fields=["account"])
    return patient


# --------------------------------------------------------------------------- #
# Registration & login
# --------------------------------------------------------------------------- #
class PatientRegisterSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True)
    password = serializers.CharField(min_length=6, write_only=True)

    def validate_email(self, value):
        if User.objects.filter(username=value).exists() or User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value


@api_view(["POST"])
@permission_classes([AllowAny])
def patient_register(request):
    serializer = PatientRegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data

    user = User(username=data["email"], email=data["email"], role=User.Role.PATIENT)
    user.first_name = data["name"]
    user.set_password(data["password"])
    user.save()
    _ensure_patient(user, name=data["name"], phone=data.get("phone", ""), email=data["email"])

    return Response({"user": _patient_user_payload(user), **_tokens_for(user)},
                    status=status.HTTP_201_CREATED)


@api_view(["POST"])
@permission_classes([AllowAny])
def patient_google(request):
    """Verify a Google ID token, then log the patient in (creating on first use)."""
    token = request.data.get("credential") or request.data.get("id_token")
    if not token:
        return Response({"detail": "Missing Google credential."}, status=400)
    if not settings.GOOGLE_CLIENT_ID:
        return Response({"detail": "Google login is not configured on the server."}, status=400)

    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token as google_id_token

        info = google_id_token.verify_oauth2_token(
            token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
        )
    except Exception:
        return Response({"detail": "Invalid Google token."}, status=400)

    email = info.get("email")
    if not email:
        return Response({"detail": "Google account has no email."}, status=400)

    user = User.objects.filter(username=email).first() or User.objects.filter(email=email).first()
    if not user:
        user = User.objects.create(
            username=email, email=email, role=User.Role.PATIENT,
            first_name=info.get("given_name", ""), last_name=info.get("family_name", ""),
        )
        user.set_unusable_password()
        user.save()
    _ensure_patient(user, name=info.get("name", ""), email=email)

    return Response({"user": _patient_user_payload(user), **_tokens_for(user)})


def _patient_user_payload(user):
    patient = Patient.objects.filter(account=user).first()
    return {
        "id": user.id,
        "name": user.get_full_name() or user.username,
        "email": user.email,
        "role": user.role,
        "patient_id": patient.id if patient else None,
    }


# --------------------------------------------------------------------------- #
# Profile + history
# --------------------------------------------------------------------------- #
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def patient_me(request):
    user = request.user
    patient = _ensure_patient(user)
    appointments = patient.appointments.select_related("doctor", "location")
    payments = patient.payments.all()
    test_orders = patient.test_orders.select_related("test")

    return Response({
        "user": _patient_user_payload(user),
        "patient": {
            "id": patient.id,
            "name": patient.name,
            "email": patient.email,
            "phone": patient.phone,
            "patient_type": patient.patient_type,
            "total_charges": patient.total_charges,
            "total_paid": patient.total_paid,
            "due": patient.due,
        },
        "appointments": AppointmentSerializer(appointments, many=True).data,
        "payments": PaymentSerializer(payments, many=True).data,
        "test_orders": TestOrderSerializer(test_orders, many=True).data,
    })


# --------------------------------------------------------------------------- #
# Booking (authenticated) + contact
# --------------------------------------------------------------------------- #
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def patient_book(request):
    serializer = BookingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    doctor = data["doctor"]
    scheduled_for = data["scheduled_for"]

    if not is_slot_open(doctor, scheduled_for):
        return Response(
            {"detail": "That slot is no longer available. Please pick another time."},
            status=status.HTTP_409_CONFLICT,
        )

    patient = _ensure_patient(
        request.user, name=data["name"], phone=data.get("phone", ""), email=data.get("email", "")
    )
    # Keep contact details fresh from the booking form.
    if data.get("phone") and not patient.phone:
        patient.phone = data["phone"]
        patient.save(update_fields=["phone"])

    appointment = Appointment.objects.create(
        patient=patient, doctor=doctor, location=doctor.location,
        scheduled_for=scheduled_for, status=Appointment.Status.BOOKED,
        source=Appointment.Source.WEBSITE, reason=data.get("reason", ""),
    )
    emailed = send_booking_confirmation(appointment)

    return Response({
        "id": appointment.id,
        "patient_name": patient.name,
        "doctor_name": doctor.name,
        "scheduled_for": appointment.scheduled_for.isoformat(),
        "location": doctor.location.name if doctor.location else None,
        "confirmation_email_sent": emailed,
    }, status=status.HTTP_201_CREATED)


class ContactSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    email = serializers.EmailField(required=False, allow_blank=True)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True)
    subject = serializers.CharField(max_length=255, required=False, allow_blank=True)
    message = serializers.CharField()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def patient_contact(request):
    serializer = ContactSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    ContactMessage.objects.create(
        user=request.user,
        name=data["name"],
        email=data.get("email", "") or request.user.email,
        phone=data.get("phone", ""),
        subject=data.get("subject", ""),
        message=data["message"],
    )
    return Response({"detail": "Message sent. We'll get back to you soon."},
                    status=status.HTTP_201_CREATED)
