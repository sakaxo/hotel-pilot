
from django.db import models
from django.utils import timezone


class RFIDCard(models.Model):
    class Status(models.TextChoices):
        AVAILABLE = "available", "Available"
        DISABLED = "disabled", "Disabled"
        LOST = "lost", "Lost"

    reference = models.CharField(max_length=20, unique=True, editable=False)
    card_identifier = models.CharField(max_length=100, unique=True)

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["reference"]

    def save(self, *args, **kwargs):
        if not self.reference:
            last_card = RFIDCard.objects.order_by("-id").first()
            next_number = (last_card.id + 1) if last_card else 1
            self.reference = f"CARD-{next_number:03d}"

        super().save(*args, **kwargs)

    def __str__(self):
        return self.reference


class AccessAssignment(models.Model):
    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        REVOKED = "revoked", "Revoked"
        EXPIRED = "expired", "Expired"

    reservation = models.ForeignKey(
        "reservations.Reservation",
        on_delete=models.PROTECT,
        related_name="access_assignments",
    )

    card = models.ForeignKey(
        RFIDCard,
        on_delete=models.PROTECT,
        related_name="assignments",
    )

    room = models.ForeignKey(
        "rooms.Room",
        on_delete=models.PROTECT,
        related_name="access_assignments",
    )

    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    assigned_at = models.DateTimeField(auto_now_add=True)
    revoked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-assigned_at"]
        indexes = [
            models.Index(fields=["card", "status"]),
            models.Index(fields=["reservation", "status"]),
            models.Index(fields=["valid_from", "valid_until"]),
        ]

    def revoke(self):
        self.status = self.Status.REVOKED
        self.revoked_at = timezone.now()
        self.save(update_fields=["status", "revoked_at"])

    def __str__(self):
        return f"{self.card} - {self.reservation.reference}"
