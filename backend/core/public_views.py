"""Public, unauthenticated endpoints used by the patient-facing booking site."""
from datetime import datetime

from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from .emails import send_booking_confirmation
from .models import Appointment, Doctor, Patient
from .slots import generate_slots, is_slot_open


class PublicDoctorSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source="location.name", read_only=True, default=None)

    class Meta:
        model = Doctor
        fields = [
            "id", "name", "specialization", "location", "location_name",
            "consultation_fee", "photo_url", "bio",
        ]


@api_view(["GET"])
@permission_classes([AllowAny])
def public_doctors(request):
    """List active doctors for the booking site (optionally ?location=)."""
    qs = Doctor.objects.filter(is_active=True).select_related("location")
    location = request.query_params.get("location")
    if location:
        qs = qs.filter(location_id=location)
    return Response(PublicDoctorSerializer(qs, many=True).data)


@api_view(["GET"])
@permission_classes([AllowAny])
def public_slots(request):
    """Available slots for ?doctor=<id>&date=YYYY-MM-DD."""
    doctor_id = request.query_params.get("doctor")
    date_str = request.query_params.get("date")
    if not doctor_id or not date_str:
        return Response({"detail": "doctor and date are required."}, status=400)
    try:
        doctor = Doctor.objects.get(pk=doctor_id, is_active=True)
    except Doctor.DoesNotExist:
        return Response({"detail": "Doctor not found."}, status=404)
    try:
        date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return Response({"detail": "date must be YYYY-MM-DD."}, status=400)

    slots = generate_slots(doctor, date)
    return Response({
        "doctor": doctor.id,
        "doctor_name": doctor.name,
        "date": date_str,
        "slots": slots,
        "has_availability": len(slots) > 0,
    })


class BookingSerializer(serializers.Serializer):
    doctor = serializers.PrimaryKeyRelatedField(queryset=Doctor.objects.filter(is_active=True))
    date = serializers.DateField()
    time = serializers.CharField()  # "HH:MM"
    name = serializers.CharField(max_length=255)
    phone = serializers.CharField(max_length=32, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    reason = serializers.CharField(max_length=500, required=False, allow_blank=True)

    def validate(self, attrs):
        if not attrs.get("phone") and not attrs.get("email"):
            raise serializers.ValidationError("Provide a phone number or email so we can reach you.")
        try:
            hour, minute = map(int, attrs["time"].split(":"))
            attrs["scheduled_for"] = timezone.make_aware(
                datetime.combine(attrs["date"], datetime.min.time().replace(hour=hour, minute=minute))
            )
        except (ValueError, TypeError):
            raise serializers.ValidationError({"time": "time must be HH:MM."})
        return attrs


@api_view(["POST"])
@permission_classes([AllowAny])
def public_book(request):
    """Create a website appointment (and the patient if new), then email them."""
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

    # Find an existing patient by phone, then email; otherwise create one.
    patient = None
    if data.get("phone"):
        patient = Patient.objects.filter(phone=data["phone"]).first()
    if not patient and data.get("email"):
        patient = Patient.objects.filter(email=data["email"]).first()
    if not patient:
        patient = Patient.objects.create(
            name=data["name"],
            phone=data.get("phone", ""),
            email=data.get("email", ""),
            location=doctor.location,
        )

    appointment = Appointment.objects.create(
        patient=patient,
        doctor=doctor,
        location=doctor.location,
        scheduled_for=scheduled_for,
        status=Appointment.Status.BOOKED,
        source=Appointment.Source.WEBSITE,
        reason=data.get("reason", ""),
    )

    emailed = send_booking_confirmation(appointment)

    return Response(
        {
            "id": appointment.id,
            "patient_name": patient.name,
            "doctor_name": doctor.name,
            "scheduled_for": appointment.scheduled_for.isoformat(),
            "location": doctor.location.name if doctor.location else None,
            "confirmation_email_sent": emailed,
        },
        status=status.HTTP_201_CREATED,
    )
