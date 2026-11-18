
from django.db.models import Q
from django.db.models.deletion import ProtectedError

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from config.pagination import StandardPagination

from .models import Room, RoomCategory
from .serializers import RoomSerializer, RoomCategorySerializer


class RoomCategoryListCreateView(APIView):

    def get(self, request):
        queryset = RoomCategory.objects.all().order_by("name")

        search = request.query_params.get("search")
        active = request.query_params.get("active")

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )

        if active is not None:
            if active.lower() in ["true", "1"]:
                queryset = queryset.filter(is_active=True)
            elif active.lower() in ["false", "0"]:
                queryset = queryset.filter(is_active=False)
            else:
                return Response(
                    {"detail": "Invalid active filter. Use true or false."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)

        serializer = RoomCategorySerializer(page, many=True)

        return paginator.get_paginated_response(serializer.data)

    def post(self, request):
        serializer = RoomCategorySerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class RoomCategoryDetailView(APIView):

    def get_object(self, pk):
        try:
            return RoomCategory.objects.get(pk=pk)
        except RoomCategory.DoesNotExist:
            return None

    def get(self, request, pk):
        category = self.get_object(pk)

        if category is None:
            return Response(
                {"detail": "Room category not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = RoomCategorySerializer(category)
        return Response(serializer.data)

    def put(self, request, pk):
        return self.update(request, pk, partial=False)

    def patch(self, request, pk):
        return self.update(request, pk, partial=True)

    def update(self, request, pk, partial=False):
        category = self.get_object(pk)

        if category is None:
            return Response(
                {"detail": "Room category not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = RoomCategorySerializer(
            category,
            data=request.data,
            partial=partial
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        category = self.get_object(pk)

        if category is None:
            return Response(
                {"detail": "Room category not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            category.delete()
        except ProtectedError:
            return Response(
                {
                    "detail": (
                        "This category has rooms assigned to it. "
                        "Deactivate it instead."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(status=status.HTTP_204_NO_CONTENT)


class RoomListCreateView(APIView):

    def get(self, request):
        queryset = Room.objects.select_related(
            "category"
        ).all().order_by("number")

        search = request.query_params.get("search")
        category = request.query_params.get("category")
        floor = request.query_params.get("floor")
        room_status = request.query_params.get("status")

        if search:
            queryset = queryset.filter(
                Q(number__icontains=search) |
                Q(category__name__icontains=search)
            )

        if category:
            queryset = queryset.filter(category_id=category)

        if floor:
            try:
                floor_number = int(floor)

                if floor_number < 1:
                    raise ValueError

                queryset = queryset.filter(floor=floor_number)

            except (ValueError, TypeError):
                return Response(
                    {"detail": "Floor must be a valid positive number."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        if room_status:
            valid_statuses = Room.Status.values

            if room_status not in valid_statuses:
                return Response(
                    {
                        "detail": (
                            "Invalid room status. "
                            f"Valid values are: {', '.join(valid_statuses)}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            queryset = queryset.filter(status=room_status)

        stats = {
            "total": Room.objects.count(),
            "available": Room.objects.filter(
                status=Room.Status.AVAILABLE
            ).count(),
            "occupied": Room.objects.filter(
                status=Room.Status.OCCUPIED
            ).count(),
            "awaiting_inspection": Room.objects.filter(
                status=Room.Status.AWAITING_INSPECTION
            ).count(),
            "maintenance": Room.objects.filter(
                status=Room.Status.MAINTENANCE
            ).count(),
        }

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)

        serializer = RoomSerializer(page, many=True)

        response = paginator.get_paginated_response(serializer.data)
        response.data["stats"] = stats

        return response

    def post(self, request):
        serializer = RoomSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class RoomDetailView(APIView):

    def get_object(self, pk):
        try:
            return Room.objects.select_related(
                "category"
            ).get(pk=pk)
        except Room.DoesNotExist:
            return None

    def get(self, request, pk):
        room = self.get_object(pk)

        if room is None:
            return Response(
                {"detail": "Room not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = RoomSerializer(room)
        return Response(serializer.data)

    def put(self, request, pk):
        return self.update(request, pk, partial=False)

    def patch(self, request, pk):
        return self.update(request, pk, partial=True)

    def update(self, request, pk, partial=False):
        room = self.get_object(pk)

        if room is None:
            return Response(
                {"detail": "Room not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = RoomSerializer(
            room,
            data=request.data,
            partial=partial
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        room = self.get_object(pk)

        if room is None:
            return Response(
                {"detail": "Room not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        room.delete()

        return Response(status=status.HTTP_204_NO_CONTENT)
