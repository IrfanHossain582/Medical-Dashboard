from django.contrib import admin

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


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "subject", "is_read", "created_at")
    list_filter = ("is_read",)
    search_fields = ("name", "email", "subject", "message")


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "city", "phone", "is_active")
    search_fields = ("name", "city")


class AvailabilityInline(admin.TabularInline):
    model = DoctorAvailability
    extra = 1


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "specialization", "location", "consultation_fee", "is_active")
    list_filter = ("location", "is_active", "specialization")
    search_fields = ("name", "specialization", "email")
    inlines = [AvailabilityInline]


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "phone", "location", "patient_type", "due", "created_at")
    list_filter = ("location", "gender")
    search_fields = ("name", "phone", "email")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "doctor", "location", "scheduled_for", "status", "source", "fee")
    list_filter = ("status", "source", "location", "doctor")
    search_fields = ("patient__name", "doctor__name")
    date_hierarchy = "scheduled_for"


@admin.register(MedicalTest)
class MedicalTestAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "code", "price", "is_active")
    search_fields = ("name", "code")


@admin.register(TestOrder)
class TestOrderAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "test", "status", "price", "ordered_at")
    list_filter = ("status", "test")
    search_fields = ("patient__name", "test__name")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "patient", "amount", "method", "appointment", "created_at")
    list_filter = ("method",)
    search_fields = ("patient__name", "reference")
