
from django.db import models
from django.core.validators import MinValueValidator


class RoomCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    base_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )

    capacity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)]
    )

    is_active = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name_plural = "Room categories"

    def __str__(self):
        return self.name


class Room(models.Model):

    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        OCCUPIED = "occupied", "Occupied"
        AWAITING_INSPECTION = (
            "awaiting_inspection",
            "Awaiting Inspection"
        )
        MAINTENANCE = "maintenance", "Maintenance"

    number = models.CharField(max_length=20, unique=True)

    category = models.ForeignKey(
        RoomCategory,
        on_delete=models.PROTECT,
        related_name="rooms"
    )

    floor = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)]
    )

    rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0.01)]
    )

    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.AVAILABLE
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["number"]

    def __str__(self):
        return f"Room {self.number}"
