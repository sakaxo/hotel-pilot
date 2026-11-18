
from rest_framework import serializers

from .models import Reservation


class ReservationSerializer(serializers.ModelSerializer):
    guest_name = serializers.SerializerMethodField()
    room_number = serializers.CharField(source="room.number", read_only=True)
    room_category = serializers.CharField(
        source="room.category.name",
        read_only=True,
    )
    nights = serializers.IntegerField(read_only=True)

    class Meta:
        model = Reservation
        fields = [
            "id",
            "reference",
            "guest",
            "guest_name",
            "room",
            "room_number",
            "room_category",
            "check_in",
            "check_out",
            "adults",
            "children",
            "rate_per_night",
            "discount_amount",
            "total_amount",
            "nights",
            "special_requests",
            "status",
            "checked_in_at",
            "checked_out_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "reference",
            "status",
            "checked_in_at",
            "checked_out_at",
            "created_at",
            "updated_at",
        ]

    def get_guest_name(self, obj):
        return f"{obj.guest.first_name} {obj.guest.last_name}"

    def validate(self, attrs):
        check_in = attrs.get(
            "check_in",
            getattr(self.instance, "check_in", None),
        )
        check_out = attrs.get(
            "check_out",
            getattr(self.instance, "check_out", None),
        )

        if check_in and check_out and check_out <= check_in:
            raise serializers.ValidationError({
                "check_out": "Checkout must be after check-in."
            })

        adults = attrs.get(
            "adults",
            getattr(self.instance, "adults", 1),
        )
        children = attrs.get(
            "children",
            getattr(self.instance, "children", 0),
        )

        if adults < 1:
            raise serializers.ValidationError({
                "adults": "At least one adult is required."
            })

        if children < 0:
            raise serializers.ValidationError({
                "children": "Children cannot be negative."
            })

        return attrs
