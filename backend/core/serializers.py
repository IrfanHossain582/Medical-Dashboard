from rest_framework import serializers

from .models import (
    Appointment,
    ContactMessage,
    Doctor,
    DoctorAvailability,
    Location,
    MedicalTest,
    Patient,
    Payment,
    TestOrder,
)


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ["id", "name", "address", "city", "phone", "is_active", "created_at"]
        read_only_fields = ["id", "created_at"]


class DoctorAvailabilitySerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(source="get_weekday_display", read_only=True)

    class Meta:
        model = DoctorAvailability
        fields = [
            "id", "doctor", "location", "weekday", "weekday_display",
            "start_time", "end_time", "slot_minutes",
        ]
        read_only_fields = ["id"]


class DoctorSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source="location.name", read_only=True, default=None)
    availabilities = DoctorAvailabilitySerializer(many=True, read_only=True)

    class Meta:
        model = Doctor
        fields = [
            "id", "name", "specialization", "email", "phone", "location",
            "location_name", "consultation_fee", "photo_url", "bio", "is_active",
            "availabilities", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PatientSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source="location.name", read_only=True, default=None)
    patient_type = serializers.CharField(read_only=True)
    total_charges = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    total_paid = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    due = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Patient
        fields = [
            "id", "name", "gender", "date_of_birth", "phone", "email", "address",
            "location", "location_name", "notes", "patient_type",
            "total_charges", "total_paid", "due", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class AppointmentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.name", read_only=True)
    doctor_name = serializers.CharField(source="doctor.name", read_only=True)
    location_name = serializers.CharField(source="location.name", read_only=True, default=None)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = Appointment
        fields = [
            "id", "patient", "patient_name", "doctor", "doctor_name", "location",
            "location_name", "scheduled_for", "status", "status_display", "source",
            "fee", "reason", "notes", "created_at",
        ]
        read_only_fields = ["id", "created_at", "created_by"]


class MedicalTestSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source="get_category_display", read_only=True)

    class Meta:
        model = MedicalTest
        fields = [
            "id", "name", "code", "category", "category_display",
            "price", "description", "is_active",
        ]
        read_only_fields = ["id"]


class TestOrderSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.name", read_only=True)
    test_name = serializers.CharField(source="test.name", read_only=True)
    test_category = serializers.CharField(source="test.get_category_display", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = TestOrder
        fields = [
            "id", "patient", "patient_name", "appointment", "test", "test_name",
            "test_category", "status", "status_display", "price", "result", "ordered_at",
        ]
        read_only_fields = ["id", "ordered_at"]


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = [
            "id", "name", "email", "phone", "subject", "message",
            "is_read", "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PaymentSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.name", read_only=True)
    method_display = serializers.CharField(source="get_method_display", read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id", "patient", "patient_name", "appointment", "amount", "method",
            "method_display", "reference", "note", "created_at",
        ]
        read_only_fields = ["id"]
