
from rest_framework import serializers

from .models import Guest


class GuestSerializer(serializers.ModelSerializer):

    class Meta:
        model = Guest
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "nationality",
            "id_type",
            "id_number",
            "address",
            "status",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_first_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "First name is required."
            )

        return value

    def validate_last_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Last name is required."
            )

        return value

    def validate_email(self, value):
        return value.strip().lower()

    def validate_phone(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Phone number is required."
            )

        return value

    def validate_nationality(self, value):
        return value.strip()

    def validate_id_type(self, value):
        return value.strip()

    def validate_id_number(self, value):
        return value.strip()

    def validate_address(self, value):
        return value.strip()
