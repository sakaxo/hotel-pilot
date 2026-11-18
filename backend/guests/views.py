from django.shortcuts import render

# Create your views here.

from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from config.pagination import StandardPagination

from .models import Guest
from .serializers import GuestSerializer


class GuestListCreateView(APIView):

    def get(self, request):
        queryset = Guest.objects.all().order_by(
            "first_name",
            "last_name"
        )

        search = request.query_params.get("search")
        guest_status = request.query_params.get("status")

        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(phone__icontains=search) |
                Q(nationality__icontains=search)
            )

        if guest_status:
            valid_statuses = Guest.Status.values

            if guest_status not in valid_statuses:
                return Response(
                    {
                        "detail": (
                            "Invalid guest status. "
                            f"Valid values are: {', '.join(valid_statuses)}."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            queryset = queryset.filter(status=guest_status)

        stats = {
            "total": Guest.objects.count(),
            "active": Guest.objects.filter(
                status=Guest.Status.ACTIVE
            ).count(),
            "inactive": Guest.objects.filter(
                status=Guest.Status.INACTIVE
            ).count(),
        }

        paginator = StandardPagination()
        page = paginator.paginate_queryset(queryset, request)

        serializer = GuestSerializer(page, many=True)

        response = paginator.get_paginated_response(serializer.data)
        response.data["stats"] = stats

        return response

    def post(self, request):
        serializer = GuestSerializer(data=request.data)

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


class GuestDetailView(APIView):

    def get_object(self, pk):
        try:
            return Guest.objects.get(pk=pk)
        except Guest.DoesNotExist:
            return None

    def get(self, request, pk):
        guest = self.get_object(pk)

        if guest is None:
            return Response(
                {"detail": "Guest not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = GuestSerializer(guest)

        return Response(serializer.data)

    def put(self, request, pk):
        return self.update(request, pk, partial=False)

    def patch(self, request, pk):
        return self.update(request, pk, partial=True)

    def update(self, request, pk, partial=False):
        guest = self.get_object(pk)

        if guest is None:
            return Response(
                {"detail": "Guest not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = GuestSerializer(
            guest,
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
