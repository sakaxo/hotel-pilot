
from decimal import Decimal
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.exceptions import ValidationError

from config.pagination import StandardPagination

from guests.models import Guest
from guests.serializers import GuestSerializer
from rooms.models import Room
from access_control.models import RFIDCard, AccessAssignment
from access_control.serializers import AccessAssignmentSerializer

from .models import Reservation
from .serializers import ReservationSerializer


ACTIVE_RESERVATION_STATUSES = [
    Reservation.Status.PENDING,
    Reservation.Status.CONFIRMED,
    Reservation.Status.CHECKED_IN,
]


def get_nights(check_in, check_out):
    return max(1, (check_out.date() - check_in.date()).days)


def validate_room_dates(room, check_in, check_out, exclude_id=None):
    if room.status == "maintenance":
        raise ValidationError({
            "room": "This room is currently under maintenance."
        })

    reservations = Reservation.objects.filter(
        room=room,
        status__in=ACTIVE_RESERVATION_STATUSES,
        check_in__lt=check_out,
        check_out__gt=check_in,
    )

    if exclude_id:
        reservations = reservations.exclude(pk=exclude_id)

    if reservations.exists():
        raise ValidationError({
            "room": "This room already has a reservation during the selected period."
        })


def validate_room_for_checkin(room):
    if room.status != "available":
        raise ValidationError({
            "room": "This room is not currently available for check-in."
        })


def get_eligible_card(card_identifier):
    identifier = card_identifier.strip().upper()

    card = RFIDCard.objects.select_for_update().filter(
        card_identifier=identifier
    ).first()

    if not card:
        raise ValidationError({
            "card_identifier": "No RFID card was found with this identifier."
        })

    if card.status != RFIDCard.Status.AVAILABLE:
        raise ValidationError({
            "card_identifier": f"This card is {card.get_status_display().lower()} and cannot be assigned."
        })

    now = timezone.now()

    # Release assignments whose validity has ended.
    AccessAssignment.objects.filter(
        card=card,
        status=AccessAssignment.Status.ACTIVE,
        valid_until__lte=now,
    ).update(
        status=AccessAssignment.Status.EXPIRED,
    )

    active_assignment = AccessAssignment.objects.filter(
        card=card,
        status=AccessAssignment.Status.ACTIVE,
    ).select_related(
        "reservation",
        "room",
        "reservation__guest",
    ).first()

    if active_assignment:
        guest = active_assignment.reservation.guest

        raise ValidationError({
            "card_identifier": (
                f"This card is currently assigned to "
                f"{guest.first_name} {guest.last_name}, "
                f"Room {active_assignment.room.number}."
            )
        })

    return card


def create_access_assignment(reservation, card_identifier):
    card = get_eligible_card(card_identifier)

    assignment = AccessAssignment.objects.create(
        reservation=reservation,
        card=card,
        room=reservation.room,
        valid_from=timezone.now(),
        valid_until=reservation.check_out,
        status=AccessAssignment.Status.ACTIVE,
    )

    return assignment


class ReservationListCreateView(APIView):

    def get(self, request):
        queryset = Reservation.objects.select_related(
            "guest",
            "room",
            "room__category",
        ).all()

        search = request.query_params.get("search")
        reservation_status = request.query_params.get("status")
        payment_status = request.query_params.get("payment_status")

        if search:
            queryset = queryset.filter(
                Q(reference__icontains=search)
                | Q(guest__first_name__icontains=search)
                | Q(guest__last_name__icontains=search)
                | Q(guest__email__icontains=search)
                | Q(guest__phone__icontains=search)
                | Q(room__number__icontains=search)
            )

        if reservation_status:
            queryset = queryset.filter(status=reservation_status)

        # Payment records will be integrated with the Payments module.
        # This endpoint does not currently filter payment status.

        stats = {
            "total": Reservation.objects.count(),
            "pending": Reservation.objects.filter(
                status=Reservation.Status.PENDING
            ).count(),
            "confirmed": Reservation.objects.filter(
                status=Reservation.Status.CONFIRMED
            ).count(),
            "checked_in": Reservation.objects.filter(
                status=Reservation.Status.CHECKED_IN
            ).count(),
            "checked_out": Reservation.objects.filter(
                status=Reservation.Status.CHECKED_OUT
            ).count(),
            "cancelled": Reservation.objects.filter(
                status=Reservation.Status.CANCELLED
            ).count(),
            "no_show": Reservation.objects.filter(
                status=Reservation.Status.NO_SHOW
            ).count(),
        }

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)

        serializer = ReservationSerializer(page, many=True)
        response = paginator.get_paginated_response(serializer.data)
        response.data["stats"] = stats

        return response

    @transaction.atomic
    def post(self, request):
        data = request.data.copy()

        room = get_object_or_404(
            Room.objects.select_for_update(),
            pk=data.get("room"),
        )

        check_in = data.get("check_in")
        check_out = data.get("check_out")

        date_field = ReservationSerializer()

        check_in = date_field.fields["check_in"].to_internal_value(check_in)
        check_out = date_field.fields["check_out"].to_internal_value(check_out)

        if check_out <= check_in:
            raise ValidationError({
                "check_out": "Checkout must be after check-in."
            })

        validate_room_dates(room, check_in, check_out)

        nights = get_nights(check_in, check_out)
        rate = room.rate

        discount = Decimal(str(data.get("discount_amount", "0")))

        if discount < 0:
            raise ValidationError({
                "discount_amount": "Discount cannot be negative."
            })

        total = max(
            Decimal(str(rate)) * nights - discount,
            Decimal("0"),
        )

        data["rate_per_night"] = rate
        data["discount_amount"] = discount
        data["total_amount"] = total

        serializer = ReservationSerializer(data=data)
        serializer.is_valid(raise_exception=True)

        reservation = serializer.save(
            status=Reservation.Status.CONFIRMED,
        )

        return Response(
            ReservationSerializer(reservation).data,
            status=status.HTTP_201_CREATED,
        )


class ReservationDetailView(APIView):

    def get_object(self, pk):
        return get_object_or_404(
            Reservation.objects.select_related(
                "guest",
                "room",
                "room__category",
            ),
            pk=pk,
        )

    def get(self, request, pk):
        reservation = self.get_object(pk)

        return Response(
            ReservationSerializer(reservation).data
        )

    @transaction.atomic
    def patch(self, request, pk):
        reservation = get_object_or_404(
            Reservation.objects.select_for_update(),
            pk=pk,
        )

        if reservation.status not in [
            Reservation.Status.PENDING,
            Reservation.Status.CONFIRMED,
        ]:
            raise ValidationError(
                "Only pending or confirmed reservations can be edited."
            )

        data = request.data.copy()

        room = reservation.room

        if "room" in data:
            room = get_object_or_404(
                Room.objects.select_for_update(),
                pk=data["room"],
            )

        serializer = ReservationSerializer(
            reservation,
            data=data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        check_in = serializer.validated_data.get(
            "check_in",
            reservation.check_in,
        )
        check_out = serializer.validated_data.get(
            "check_out",
            reservation.check_out,
        )

        if check_out <= check_in:
            raise ValidationError({
                "check_out": "Checkout must be after check-in."
            })

        validate_room_dates(
            room,
            check_in,
            check_out,
            exclude_id=reservation.id,
        )

        rate = serializer.validated_data.get(
            "rate_per_night",
            reservation.rate_per_night,
        )

        discount = serializer.validated_data.get(
            "discount_amount",
            reservation.discount_amount,
        )

        nights = get_nights(check_in, check_out)

        # Recalculate only when the stay, room or price changes.
        price_changed = (
            "check_in" in data
            or "check_out" in data
            or "room" in data
            or "rate_per_night" in data
            or "discount_amount" in data
        )

        if "room" in data and "rate_per_night" not in data:
            rate = room.rate

        if price_changed:
            total = max(
                Decimal(str(rate)) * nights - Decimal(str(discount)),
                Decimal("0"),
            )
            serializer.save(
                rate_per_night=rate,
                total_amount=total,
            )
        else:
            serializer.save()

        reservation.refresh_from_db()

        return Response(
            ReservationSerializer(reservation).data
        )


class ReservationCancelView(APIView):

    @transaction.atomic
    def post(self, request, pk):
        reservation = get_object_or_404(
            Reservation.objects.select_for_update(),
            pk=pk,
        )

        if reservation.status in [
            Reservation.Status.CHECKED_IN,
            Reservation.Status.CHECKED_OUT,
            Reservation.Status.CANCELLED,
        ]:
            raise ValidationError(
                "This reservation cannot be cancelled."
            )

        reservation.status = Reservation.Status.CANCELLED
        reservation.save(update_fields=["status", "updated_at"])

        return Response({
            "message": "Reservation cancelled successfully.",
            "reservation": ReservationSerializer(reservation).data,
        })


class WalkInCheckInView(APIView):

    @transaction.atomic
    def post(self, request):
        data = request.data

        # Resolve existing guest or register a new one.
        guest_id = data.get("guest")

        if guest_id:
            guest = get_object_or_404(
                Guest.objects.select_for_update(),
                pk=guest_id,
            )
        else:
            guest_data = data.get("new_guest")

            if not isinstance(guest_data, dict):
                raise ValidationError({
                    "new_guest": "Guest details are required."
                })

            guest_serializer = GuestSerializer(data=guest_data)
            guest_serializer.is_valid(raise_exception=True)
            guest = guest_serializer.save()

        # Lock and validate the selected room.
        room = get_object_or_404(
            Room.objects.select_for_update(),
            pk=data.get("room"),
        )

        validate_room_for_checkin(room)

        date_field = ReservationSerializer()

        check_in = date_field.fields["check_in"].to_internal_value(
            data.get("check_in")
        )
        check_out = date_field.fields["check_out"].to_internal_value(
            data.get("check_out")
        )

        if check_out <= check_in:
            raise ValidationError({
                "check_out": "Checkout must be after check-in."
            })

        validate_room_dates(room, check_in, check_out)

        card_identifier = data.get("card_identifier")

        if not card_identifier:
            raise ValidationError({
                "card_identifier": "RFID card identifier is required."
            })

        # Validate the card before creating the reservation.
        card = get_eligible_card(card_identifier)

        nights = get_nights(check_in, check_out)
        rate = Decimal(str(room.rate))

        discount = Decimal(str(data.get("discount_amount", "0")))

        if discount < 0:
            raise ValidationError({
                "discount_amount": "Discount cannot be negative."
            })

        total = max(
            rate * nights - discount,
            Decimal("0"),
        )

        reservation = Reservation.objects.create(
            guest=guest,
            room=room,
            check_in=check_in,
            check_out=check_out,
            adults=data.get("adults", 1),
            children=data.get("children", 0),
            rate_per_night=rate,
            discount_amount=discount,
            total_amount=total,
            special_requests=data.get("special_requests", ""),
            status=Reservation.Status.CHECKED_IN,
            checked_in_at=timezone.now(),
        )

        assignment = AccessAssignment.objects.create(
            reservation=reservation,
            card=card,
            room=room,
            valid_from=timezone.now(),
            valid_until=check_out,
            status=AccessAssignment.Status.ACTIVE,
        )

        room.status = "occupied"
        room.save(update_fields=["status"])

        return Response({
            "message": "Guest checked in successfully.",
            "reservation": ReservationSerializer(reservation).data,
            "access_assignment": AccessAssignmentSerializer(
                assignment
            ).data,
        }, status=status.HTTP_201_CREATED)


class ReservationCheckInView(APIView):

    @transaction.atomic
    def post(self, request, pk):
        reservation = get_object_or_404(
            Reservation.objects.select_for_update().select_related(
                "guest",
                "room",
            ),
            pk=pk,
        )

        if reservation.status not in [
            Reservation.Status.PENDING,
            Reservation.Status.CONFIRMED,
        ]:
            raise ValidationError(
                "This reservation cannot be checked in."
            )

        room = Room.objects.select_for_update().get(
            pk=reservation.room_id
        )

        validate_room_for_checkin(room)

        validate_room_dates(
            room,
            reservation.check_in,
            reservation.check_out,
            exclude_id=reservation.id,
        )

        card_identifier = request.data.get("card_identifier")

        if not card_identifier:
            raise ValidationError({
                "card_identifier": "RFID card identifier is required."
            })

        assignment = create_access_assignment(
            reservation,
            card_identifier,
        )

        reservation.status = Reservation.Status.CHECKED_IN
        reservation.checked_in_at = timezone.now()
        reservation.save(
            update_fields=[
                "status",
                "checked_in_at",
                "updated_at",
            ]
        )

        room.status = "occupied"
        room.save(update_fields=["status"])

        return Response({
            "message": "Guest checked in successfully.",
            "reservation": ReservationSerializer(reservation).data,
            "access_assignment": AccessAssignmentSerializer(
                assignment
            ).data,
        })


class ReservationCheckOutView(APIView):

    @transaction.atomic
    def post(self, request, pk):
        reservation = get_object_or_404(
            Reservation.objects.select_for_update().select_related(
                "room",
            ),
            pk=pk,
        )

        if reservation.status != Reservation.Status.CHECKED_IN:
            raise ValidationError(
                "Only checked-in reservations can be checked out."
            )

        now = timezone.now()

        assignments = AccessAssignment.objects.select_for_update().filter(
            reservation=reservation,
            status=AccessAssignment.Status.ACTIVE,
        )

        for assignment in assignments:
            assignment.revoke()

        room = Room.objects.select_for_update().get(
            pk=reservation.room_id
        )

        reservation.status = Reservation.Status.CHECKED_OUT
        reservation.checked_out_at = now
        reservation.save(
            update_fields=[
                "status",
                "checked_out_at",
                "updated_at",
            ]
        )

        room.status = "awaiting_inspection"
        room.save(update_fields=["status"])

        return Response({
            "message": "Guest checked out successfully. Access has been revoked.",
            "reservation": ReservationSerializer(reservation).data,
        })


class RFIDCardLookupView(APIView):

    def get(self, request):
        identifier = request.query_params.get("card_identifier", "").strip().upper()

        if not identifier:
            raise ValidationError({
                "card_identifier": "Enter the RFID card identifier."
            })

        card = RFIDCard.objects.filter(
            card_identifier=identifier
        ).first()

        if not card:
            return Response({
                "found": False,
                "available": False,
                "message": "No RFID card was found with this identifier.",
            }, status=status.HTTP_404_NOT_FOUND)

        if card.status != RFIDCard.Status.AVAILABLE:
            return Response({
                "found": True,
                "available": False,
                "card": {
                    "reference": card.reference,
                    "card_identifier": card.card_identifier,
                    "status": card.status,
                },
                "message": "This card is disabled or reported lost.",
            })

        now = timezone.now()

        AccessAssignment.objects.filter(
            card=card,
            status=AccessAssignment.Status.ACTIVE,
            valid_until__lte=now,
        ).update(
            status=AccessAssignment.Status.EXPIRED,
        )

        assignment = AccessAssignment.objects.filter(
            card=card,
            status=AccessAssignment.Status.ACTIVE,
        ).select_related(
            "reservation__guest",
            "room",
        ).first()

        if assignment:
            guest = assignment.reservation.guest

            return Response({
                "found": True,
                "available": False,
                "card": {
                    "reference": card.reference,
                    "card_identifier": card.card_identifier,
                },
                "current_assignment": {
                    "guest": f"{guest.first_name} {guest.last_name}",
                    "reservation": assignment.reservation.reference,
                    "room": assignment.room.number,
                    "valid_until": assignment.valid_until,
                },
                "message": "This card is currently assigned to another guest.",
            })

        return Response({
            "found": True,
            "available": True,
            "card": {
                "reference": card.reference,
                "card_identifier": card.card_identifier,
                "status": card.status,
            },
            "message": "Card verified and available for assignment.",
        })
