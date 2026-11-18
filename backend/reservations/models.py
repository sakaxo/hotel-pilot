
import uuid

from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone


class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        CONFIRMED = "confirmed", "Confirmed"
        CHECKED_IN = "checked_in", "Checked In"
        CHECKED_OUT = "checked_out", "Checked Out"
        CANCELLED = "cancelled", "Cancelled"
        NO_SHOW = "no_show", "No Show"

    reference = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
    )

    guest = models.ForeignKey(
        "guests.Guest",
        on_delete=models.PROTECT,
        related_name="reservations",
    )

    room = models.ForeignKey(
        "rooms.Room",
        on_delete=models.PROTECT,
        related_name="reservations",
    )

    check_in = models.DateTimeField()
    check_out = models.DateTimeField()

    adults = models.PositiveSmallIntegerField(default=1)
    children = models.PositiveSmallIntegerField(default=0)

    rate_per_night = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )

    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        validators=[MinValueValidator(0)],
    )

    total_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )

    special_requests = models.TextField(blank=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.CONFIRMED,
    )

    checked_in_at = models.DateTimeField(null=True, blank=True)
    checked_out_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["reference"]),
            models.Index(fields=["status"]),
            models.Index(fields=["check_in", "check_out"]),
            models.Index(fields=["room", "status"]),
        ]

    def save(self, *args, **kwargs):
        if not self.reference:
            self.reference = f"RSV-{uuid.uuid4().hex[:8].upper()}"

        super().save(*args, **kwargs)

    @property
    def nights(self):
        return max(0, (self.check_out.date() - self.check_in.date()).days)

    def __str__(self):
        return f"{self.reference} - {self.guest}"
