from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from core.patient_views import (
    patient_book,
    patient_contact,
    patient_google,
    patient_me,
    patient_register,
)
from core.public_views import public_book, public_doctors, public_slots
from core.views import (
    AppointmentViewSet,
    ContactMessageViewSet,
    DoctorAvailabilityViewSet,
    DoctorViewSet,
    LocationViewSet,
    MedicalTestViewSet,
    PatientViewSet,
    PaymentViewSet,
    TestOrderViewSet,
    dashboard_summary,
)

from . import views

router = DefaultRouter()
router.register("locations", LocationViewSet)
router.register("doctors", DoctorViewSet)
router.register("availability", DoctorAvailabilityViewSet)
router.register("patients", PatientViewSet)
router.register("appointments", AppointmentViewSet)
router.register("tests", MedicalTestViewSet)
router.register("test-orders", TestOrderViewSet)
router.register("payments", PaymentViewSet)
router.register("users", views.UserViewSet)
router.register("messages", ContactMessageViewSet)

urlpatterns = [
    # Auth
    path("auth/register/", views.register, name="register"),
    path("auth/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    # Public booking site (no auth)
    path("public/doctors/", public_doctors, name="public_doctors"),
    path("public/slots/", public_slots, name="public_slots"),
    path("public/book/", public_book, name="public_book"),
    # Patient accounts (website)
    path("patient/register/", patient_register, name="patient_register"),
    path("patient/google/", patient_google, name="patient_google"),
    path("patient/me/", patient_me, name="patient_me"),
    path("patient/book/", patient_book, name="patient_book"),
    path("patient/contact/", patient_contact, name="patient_contact"),
    # Profile + misc
    path("health/", views.health, name="health"),
    path("me/", views.MeView.as_view(), name="me"),
    path("dashboard/summary/", dashboard_summary, name="dashboard_summary"),
    # Domain resources
    path("", include(router.urls)),
]
