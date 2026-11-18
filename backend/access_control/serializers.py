
from rest_framework import serializers

from .models import RFIDCard, AccessAssignment


class RFIDCardSerializer(serializers.ModelSerializer):

    class Meta:
        model = RFIDCard
        fields = [
            "id",
            "reference",
            "card_identifier",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "reference",
            "created_at",
            "updated_at",
        ]

    def validate_card_identifier(self, value):
        value = value.strip().upper()

        queryset = RFIDCard.objects.filter(
            card_identifier=value
        )

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "This RFID card identifier is already registered."
            )

        return value


class AccessAssignmentSerializer(serializers.ModelSerializer):

    card_identifier = serializers.CharField(
        source="card.card_identifier",
        read_only=True,
    )

    card_reference = serializers.CharField(
        source="card.reference",
        read_only=True,
    )

    reservation_reference = serializers.CharField(
        source="reservation.reference",
        read_only=True,
    )

    room_number = serializers.CharField(
        source="room.number",
        read_only=True,
    )

    class Meta:
        model = AccessAssignment

        fields = [
            "id",
            "reservation",
            "reservation_reference",
            "card",
            "card_identifier",
            "card_reference",
            "room",
            "room_number",
            "valid_from",
            "valid_until",
            "status",
            "assigned_at",
            "revoked_at",
        ]

        read_only_fields = [
            "id",
            "status",
            "assigned_at",
            "revoked_at",
        ]
