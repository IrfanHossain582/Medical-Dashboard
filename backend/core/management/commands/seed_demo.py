"""Seed demo data for the medical dashboard.

Usage: python manage.py seed_demo
Creates an admin user (admin@clinic.test / admin12345), locations, doctors,
patients, appointments, tests and payments so the dashboard is populated.
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import (
    Appointment,
    Doctor,
    DoctorAvailability,
    Location,
    MedicalTest,
    Patient,
    Payment,
    TestOrder,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Seed demo data for the medical dashboard."

    def handle(self, *args, **options):
        admin, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@clinic.test",
                "is_staff": True,
                "is_superuser": True,
                "role": User.Role.ADMIN,
            },
        )
        if created:
            admin.set_password("admin12345")
            admin.save()
            self.stdout.write(self.style.SUCCESS("Created admin / admin12345"))

        downtown = Location.objects.get_or_create(
            name="Downtown Clinic", defaults={"city": "Metropolis", "phone": "+1-555-0100"}
        )[0]
        uptown = Location.objects.get_or_create(
            name="Uptown Branch", defaults={"city": "Metropolis", "phone": "+1-555-0200"}
        )[0]

        cardio = Doctor.objects.get_or_create(
            name="Dr. Alice Heart",
            defaults={
                "specialization": "Cardiologist",
                "email": "alice@clinic.test",
                "location": downtown,
                "consultation_fee": 120,
                "photo_url": "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop",
                "bio": "Board-certified cardiologist with 15 years of experience in preventive heart care and interventional cardiology.",
            },
        )[0]
        derma = Doctor.objects.get_or_create(
            name="Dr. Bob Skin",
            defaults={
                "specialization": "Dermatologist",
                "email": "bob@clinic.test",
                "location": uptown,
                "consultation_fee": 90,
                "photo_url": "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop",
                "bio": "Specialist in medical and cosmetic dermatology, treating skin, hair, and nail conditions for all ages.",
            },
        )[0]
        neuro = Doctor.objects.get_or_create(
            name="Dr. Carol Nerve",
            defaults={
                "specialization": "Neurologist",
                "email": "carol@clinic.test",
                "location": downtown,
                "consultation_fee": 140,
                "photo_url": "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop",
                "bio": "Neurologist focused on headache disorders, epilepsy, and stroke rehabilitation.",
            },
        )[0]
        pediatric = Doctor.objects.get_or_create(
            name="Dr. David Child",
            defaults={
                "specialization": "Pediatrician",
                "email": "david@clinic.test",
                "location": uptown,
                "consultation_fee": 80,
                "photo_url": "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop",
                "bio": "Caring pediatrician supporting your child's health from newborn check-ups through adolescence.",
            },
        )[0]

        for doc in (cardio, derma, neuro, pediatric):
            for wd in range(0, 5):  # Mon-Fri
                DoctorAvailability.objects.get_or_create(
                    doctor=doc, weekday=wd, start_time="09:00", end_time="13:00",
                    defaults={"location": doc.location, "slot_minutes": 30},
                )

        p1 = Patient.objects.get_or_create(
            name="John Doe",
            defaults={"phone": "+1-555-1111", "gender": "male", "location": downtown},
        )[0]
        p2 = Patient.objects.get_or_create(
            name="Jane Smith",
            defaults={"phone": "+1-555-2222", "gender": "female", "location": uptown},
        )[0]

        now = timezone.now()
        a1 = Appointment.objects.get_or_create(
            patient=p1, doctor=cardio, scheduled_for=now + timedelta(days=1),
            defaults={"location": downtown, "status": "confirmed", "reason": "Chest pain"},
        )[0]
        # Make Jane an "old" patient with two appointments.
        Appointment.objects.get_or_create(
            patient=p2, doctor=derma, scheduled_for=now - timedelta(days=10),
            defaults={"location": uptown, "status": "completed", "reason": "Rash"},
        )
        Appointment.objects.get_or_create(
            patient=p2, doctor=derma, scheduled_for=now + timedelta(days=2),
            defaults={"location": uptown, "status": "booked", "reason": "Follow-up"},
        )

        cbc = MedicalTest.objects.get_or_create(
            name="Complete Blood Count", defaults={"code": "CBC", "price": 25}
        )[0]
        lipid = MedicalTest.objects.get_or_create(
            name="Lipid Panel", defaults={"code": "LIPID", "price": 40}
        )[0]

        TestOrder.objects.get_or_create(patient=p1, test=cbc, appointment=a1)
        TestOrder.objects.get_or_create(patient=p1, test=lipid, appointment=a1)

        Payment.objects.get_or_create(
            patient=p1, appointment=a1, amount=100,
            defaults={"method": "cash", "received_by": admin},
        )

        self.stdout.write(self.style.SUCCESS("Demo data seeded."))
