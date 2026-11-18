
from django.db import models


class Guest(models.Model):

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        INACTIVE = "inactive", "Inactive"

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)

    email = models.EmailField()
    phone = models.CharField(max_length=30)

    nationality = models.CharField(
        max_length=100,
        blank=True
    )

    id_type = models.CharField(
        max_length=50,
        blank=True
    )

    id_number = models.CharField(
        max_length=100,
        blank=True
    )

    address = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["first_name", "last_name"]
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["phone"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
