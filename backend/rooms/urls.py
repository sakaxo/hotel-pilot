
from django.urls import path

from .views import (
    RoomCategoryListCreateView,
    RoomCategoryDetailView,
    RoomListCreateView,
    RoomDetailView,
)


urlpatterns = [
    path(
        "categories/",
        RoomCategoryListCreateView.as_view(),
        name="room-category-list-create"
    ),
    path(
        "categories/<int:pk>/",
        RoomCategoryDetailView.as_view(),
        name="room-category-detail"
    ),
    path(
        "",
        RoomListCreateView.as_view(),
        name="room-list-create"
    ),
    path(
        "<int:pk>/",
        RoomDetailView.as_view(),
        name="room-detail"
    ),
]
