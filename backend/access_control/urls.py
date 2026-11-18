
from django.urls import path
from .views import (
    RFIDCardListCreateView,
    RFIDCardDetailView,
)

urlpatterns = [
    path("access-control/cards/", RFIDCardListCreateView.as_view(), name="card-list-create"),
    path("access-control/cards/<int:pk>/", RFIDCardDetailView.as_view(), name="card-detail"),
]
