"""Medical dashboard domain models.

Entities: Location, Doctor (+ availability), Patient, Appointment,
MedicalTest catalogue, TestOrder, Payment. Billing/dues are computed from
appointment fees + test prices minus recorded payments.
"""
from django.conf import settings
from django.db import models
from django.db.models import Sum
from django.utils import timezone


class Location(models.Model):
    """A clinic branch. Patients, doctors and appointments are scoped to one."""

    name = models.CharField(max_length=255)
    address = models.CharField(max_length=500, blank=True, default="")
    city = models.CharField(max_length=120, blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Doctor(models.Model):
    """A practitioner. May optionally be linked to a login User."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="doctor_profile",
    )
    name = models.CharField(max_length=255)
    specialization = models.CharField(max_length=255, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
    location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="doctors"
    )
    consultation_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    photo_url = models.URLField(blank=True, default="")
    bio = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class DoctorAvailability(models.Model):
    """Recurring weekly availability that drives the booking-slot calendar."""

    class Weekday(models.IntegerChoices):
        MONDAY = 0, "Monday"
        TUESDAY = 1, "Tuesday"
        WEDNESDAY = 2, "Wednesday"
        THURSDAY = 3, "Thursday"
        FRIDAY = 4, "Friday"
        SATURDAY = 5, "Saturday"
        SUNDAY = 6, "Sunday"

    doctor = models.ForeignKey(
        Doctor, on_delete=models.CASCADE, related_name="availabilities"
    )
    location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, blank=True
    )
    weekday = models.IntegerField(choices=Weekday.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_minutes = models.PositiveIntegerField(default=30)

    class Meta:
        ordering = ["weekday", "start_time"]

    def __str__(self):
        return f"{self.doctor.name} {self.get_weekday_display()} {self.start_time}-{self.end_time}"


class Patient(models.Model):
    class Gender(models.TextChoices):
        MALE = "male", "Male"
        FEMALE = "female", "Female"
        OTHER = "other", "Other"

    account = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patient_record",
    )
    name = models.CharField(max_length=255)
    gender = models.CharField(max_length=10, choices=Gender.choices, blank=True, default="")
    date_of_birth = models.DateField(null=True, blank=True)
    phone = models.CharField(max_length=32, blank=True, default="")
    email = models.EmailField(blank=True, default="")
    address = models.CharField(max_length=500, blank=True, default="")
    location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="patients"
    )
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.name

    @property
    def patient_type(self):
        """'new' until the patient has more than one appointment, then 'old'."""
        return "old" if self.appointments.count() > 1 else "new"

    @property
    def total_charges(self):
        fees = self.appointments.aggregate(s=Sum("fee"))["s"] or 0
        tests = self.test_orders.aggregate(s=Sum("price"))["s"] or 0
        return fees + tests

    @property
    def total_paid(self):
        return self.payments.aggregate(s=Sum("amount"))["s"] or 0

    @property
    def due(self):
        return self.total_charges - self.total_paid


class Appointment(models.Model):
    class Status(models.TextChoices):
        BOOKED = "booked", "Booked"
        CONFIRMED = "confirmed", "Confirmed"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"
        NO_SHOW = "no_show", "No Show"

    class Source(models.TextChoices):
        MANUAL = "manual", "Manual (Dashboard)"
        WEBSITE = "website", "Website"
        API = "api", "API / Webhook"

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="appointments"
    )
    doctor = models.ForeignKey(
        Doctor, on_delete=models.PROTECT, related_name="appointments"
    )
    location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, blank=True, related_name="appointments"
    )
    scheduled_for = models.DateTimeField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.BOOKED)
    source = models.CharField(max_length=10, choices=Source.choices, default=Source.MANUAL)
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    reason = models.CharField(max_length=500, blank=True, default="")
    notes = models.TextField(blank=True, default="")
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-scheduled_for"]

    def __str__(self):
        return f"{self.patient.name} → {self.doctor.name} @ {self.scheduled_for:%Y-%m-%d %H:%M}"

    def save(self, *args, **kwargs):
        # Snapshot the doctor's consultation fee when first created.
        if not self.pk and not self.fee and self.doctor_id:
            self.fee = self.doctor.consultation_fee
        if not self.location_id and self.doctor_id:
            self.location = self.doctor.location
        super().save(*args, **kwargs)


class MedicalTest(models.Model):
    """Catalogue of orderable tests (lab, diagnostic, imaging, etc.)."""

    class Category(models.TextChoices):
        LAB = "lab", "Lab Test"
        DIAGNOSTIC = "diagnostic", "Diagnostic Test"
        IMAGING = "imaging", "Imaging"
        PROCEDURE = "procedure", "Procedure"
        OTHER = "other", "Other"

    name = models.CharField(max_length=255)
    code = models.CharField(max_length=64, blank=True, default="")
    category = models.CharField(
        max_length=12, choices=Category.choices, default=Category.LAB
    )
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class TestOrder(models.Model):
    class Status(models.TextChoices):
        ORDERED = "ordered", "Ordered"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="test_orders"
    )
    appointment = models.ForeignKey(
        Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name="test_orders"
    )
    test = models.ForeignKey(MedicalTest, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.ORDERED)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    result = models.TextField(blank=True, default="")
    ordered_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-ordered_at"]

    def __str__(self):
        return f"{self.test.name} for {self.patient.name}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.price and self.test_id:
            self.price = self.test.price
        super().save(*args, **kwargs)


class Payment(models.Model):
    class Method(models.TextChoices):
        CASH = "cash", "Cash"
        CARD = "card", "Card"
        BANK = "bank", "Bank Transfer"
        MOBILE = "mobile", "Mobile Money"
        INSURANCE = "insurance", "Insurance"
        OTHER = "other", "Other"

    patient = models.ForeignKey(
        Patient, on_delete=models.CASCADE, related_name="payments"
    )
    appointment = models.ForeignKey(
        Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name="payments"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    method = models.CharField(max_length=12, choices=Method.choices, default=Method.CASH)
    reference = models.CharField(max_length=255, blank=True, default="")
    note = models.CharField(max_length=500, blank=True, default="")
    received_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.amount} ({self.get_method_display()}) - {self.patient.name}"


class ContactMessage(models.Model):
    """A message submitted from the website contact form; shown to admins."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="contact_messages",
    )
    name = models.CharField(max_length=255)
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=32, blank=True, default="")
    subject = models.CharField(max_length=255, blank=True, default="")
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.name}: {self.subject or self.message[:40]}"
