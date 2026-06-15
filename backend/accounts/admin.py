from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import Organization, User


@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at")
    search_fields = ("name",)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("id", "username", "email", "role", "location", "is_staff")
    list_filter = ("role", "is_staff", "location")
    search_fields = ("email", "username")
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Medical dashboard", {"fields": ("role", "phone", "organization", "location")}),
    )
