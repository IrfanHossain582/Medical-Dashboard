from datetime import timedelta

from django.db.models import Count, Sum
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

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
from .serializers import (
    AppointmentSerializer,
    ContactMessageSerializer,
    DoctorAvailabilitySerializer,
    DoctorSerializer,
    LocationSerializer,
    MedicalTestSerializer,
    PatientSerializer,
    PaymentSerializer,
    TestOrderSerializer,
)


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "city"]


class DoctorViewSet(viewsets.ModelViewSet):
    queryset = Doctor.objects.select_related("location").prefetch_related("availabilities")
    serializer_class = DoctorSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["location", "specialization", "is_active"]
    search_fields = ["name", "specialization", "email"]


class DoctorAvailabilityViewSet(viewsets.ModelViewSet):
    queryset = DoctorAvailability.objects.select_related("doctor", "location")
    serializer_class = DoctorAvailabilitySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["doctor", "location", "weekday"]


class PatientViewSet(viewsets.ModelViewSet):
    queryset = Patient.objects.select_related("location")
    serializer_class = PatientSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["location", "gender"]
    search_fields = ["name", "phone", "email"]


class AppointmentViewSet(viewsets.ModelViewSet):
    queryset = Appointment.objects.select_related("patient", "doctor", "location")
    serializer_class = AppointmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["location", "doctor", "patient", "status", "source"]
    search_fields = ["patient__name", "doctor__name"]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MedicalTestViewSet(viewsets.ModelViewSet):
    queryset = MedicalTest.objects.all()
    serializer_class = MedicalTestSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["is_active", "category"]
    search_fields = ["name", "code"]


class TestOrderViewSet(viewsets.ModelViewSet):
    queryset = TestOrder.objects.select_related("patient", "test", "appointment")
    serializer_class = TestOrderSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["patient", "test", "status"]


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("patient", "appointment")
    serializer_class = PaymentSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ["patient", "method"]

    def perform_create(self, serializer):
        serializer.save(received_by=self.request.user)


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["is_read"]
    search_fields = ["name", "email", "subject", "message"]


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_summary(request):
    """Aggregated KPIs for the dashboard home, optionally scoped by ?location=."""
    location = request.query_params.get("location")

    patients = Patient.objects.all()
    appointments = Appointment.objects.all()
    payments = Payment.objects.all()
    if location:
        patients = patients.filter(location_id=location)
        appointments = appointments.filter(location_id=location)
        payments = payments.filter(patient__location_id=location)

    today = timezone.localdate()
    week_ago = timezone.now() - timedelta(days=7)

    # Total dues across all patients = charges - payments.
    total_charges = (
        (appointments.aggregate(s=Sum("fee"))["s"] or 0)
        + (TestOrder.objects.aggregate(s=Sum("price"))["s"] or 0)
    )
    total_paid = payments.aggregate(s=Sum("amount"))["s"] or 0

    return Response({
        "patients_total": patients.count(),
        "doctors_total": Doctor.objects.filter(is_active=True).count(),
        "appointments_today": appointments.filter(scheduled_for__date=today).count(),
        "appointments_total": appointments.count(),
        "revenue_last_7d": payments.filter(created_at__gte=week_ago).aggregate(s=Sum("amount"))["s"] or 0,
        "total_due": total_charges - total_paid,
        "unread_messages": ContactMessage.objects.filter(is_read=False).count(),
        "appointments_by_status": list(
            appointments.values("status").annotate(count=Count("id")).order_by()
        ),
        "appointments_by_location": list(
            Appointment.objects.values("location__name").annotate(count=Count("id")).order_by()
        ),
    })
