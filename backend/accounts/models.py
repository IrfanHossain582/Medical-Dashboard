from django.contrib.auth.models import AbstractUser
from django.db import models


class Organization(models.Model):
    """The clinic/hospital tenant. Optional single-tenant by default."""

    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    """
    Self-contained user. Credentials (password) live in this database and are
    authenticated via JWT (djangorestframework-simplejwt).

    `role` drives dashboard permissions (RBAC). `email` is the login identifier
    in the UI, though Django still uses `username` internally.
    """

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        RECEPTIONIST = "receptionist", "Receptionist"
        DOCTOR = "doctor", "Doctor"
        LAB = "lab", "Lab Technician"
        ACCOUNTANT = "accountant", "Accountant"
        PATIENT = "patient", "Patient"

    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="members",
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.ADMIN)
    phone = models.CharField(max_length=32, blank=True, default="")
    # Optional location scoping for staff (e.g. a receptionist at one branch).
    location = models.ForeignKey(
        "core.Location",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="staff",
    )

    def __str__(self):
        return self.email or self.username

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    @property
    def is_patient(self):
        return self.role == self.Role.PATIENT
