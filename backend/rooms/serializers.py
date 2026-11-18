
from rest_framework import serializers

from .models import Room, RoomCategory


class RoomCategorySerializer(serializers.ModelSerializer):
    room_count = serializers.SerializerMethodField()

    class Meta:
        model = RoomCategory
        fields = [
            "id",
            "name",
            "description",
            "base_rate",
            "capacity",
            "is_active",
            "room_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "room_count",
            "created_at",
            "updated_at",
        ]

    def get_room_count(self, obj):
        return obj.rooms.count()

    def validate_name(self, value):
        value = value.strip()

        queryset = RoomCategory.objects.filter(name__iexact=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "A room category with this name already exists."
            )

        return value

    def validate_description(self, value):
        return value.strip()


class RoomSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.name",
        read_only=True
    )

    category_capacity = serializers.IntegerField(
        source="category.capacity",
        read_only=True
    )

    class Meta:
        model = Room
        fields = [
            "id",
            "number",
            "category",
            "category_name",
            "category_capacity",
            "floor",
            "rate",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_number(self, value):
        value = value.strip().upper()

        queryset = Room.objects.filter(number__iexact=value)

        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError(
                "A room with this number already exists."
            )

        return value

    def validate_category(self, value):
        if not value.is_active:
            raise serializers.ValidationError(
                "You cannot assign a room to an inactive category."
            )

        return value
