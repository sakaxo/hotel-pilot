
from django.urls import path

from .views import (
    ReservationListCreateView,
    ReservationDetailView,
    ReservationCancelView,
    WalkInCheckInView,
    ReservationCheckInView,
    ReservationCheckOutView,
    RFIDCardLookupView,
)

urlpatterns = [
    path("", ReservationListCreateView.as_view(), name="reservation-list-create"),
    path("walk-in/", WalkInCheckInView.as_view(), name="reservation-walk-in"),
    path("card-lookup/", RFIDCardLookupView.as_view(), name="reservation-card-lookup"),

    path("<int:pk>/", ReservationDetailView.as_view(), name="reservation-detail"),
    path("<int:pk>/cancel/", ReservationCancelView.as_view(), name="reservation-cancel"),
    path("<int:pk>/check-in/", ReservationCheckInView.as_view(), name="reservation-check-in"),
    path("<int:pk>/check-out/", ReservationCheckOutView.as_view(), name="reservation-check-out"),
]
