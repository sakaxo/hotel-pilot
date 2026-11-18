from django.db.models import Q

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import RFIDCard
from .serializers import RFIDCardSerializer
from .pagination import RFIDCardPagination


class RFIDCardListCreateView(APIView):

    def get(self, request):
        cards = RFIDCard.objects.all().order_by("-created_at")

        search = request.query_params.get("search", "").strip()
        card_status = request.query_params.get("status", "").strip().lower()

        if search:
            cards = cards.filter(
                Q(reference__icontains=search) |
                Q(card_identifier__icontains=search)
            )

        if card_status:
            valid_statuses = [
                choice[0] for choice in RFIDCard.Status.choices
            ]

            if card_status not in valid_statuses:
                return Response(
                    {"error": "Invalid card status."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            cards = cards.filter(status=card_status)

        all_cards = RFIDCard.objects.all()

        stats = {
            "total": all_cards.count(),
            "available": all_cards.filter(
                status=RFIDCard.Status.AVAILABLE
            ).count(),
            "disabled": all_cards.filter(
                status=RFIDCard.Status.DISABLED
            ).count(),
            "lost": all_cards.filter(
                status=RFIDCard.Status.LOST
            ).count(),
        }

        paginator = RFIDCardPagination()
        page = paginator.paginate_queryset(cards, request, view=self)

        serializer = RFIDCardSerializer(page, many=True)

        response = paginator.get_paginated_response(serializer.data)
        response.data["stats"] = stats

        return response

    def post(self, request):
        serializer = RFIDCardSerializer(data=request.data)

        if serializer.is_valid():
            card = serializer.save()

            return Response(
                RFIDCardSerializer(card).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class RFIDCardDetailView(APIView):

    def get_object(self, pk):
        try:
            return RFIDCard.objects.get(pk=pk)
        except RFIDCard.DoesNotExist:
            return None

    def get(self, request, pk):
        card = self.get_object(pk)

        if not card:
            return Response(
                {"error": "Card not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = RFIDCardSerializer(card)
        return Response(serializer.data)

    def put(self, request, pk):
        card = self.get_object(pk)

        if not card:
            return Response(
                {"error": "Card not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = RFIDCardSerializer(card, data=request.data)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def patch(self, request, pk):
        card = self.get_object(pk)

        if not card:
            return Response(
                {"error": "Card not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = RFIDCardSerializer(
            card,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    def delete(self, request, pk):
        card = self.get_object(pk)

        if not card:
            return Response(
                {"error": "Card not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        card.delete()

        return Response(
            {"message": "Card deleted successfully."},
            status=status.HTTP_200_OK
        )
