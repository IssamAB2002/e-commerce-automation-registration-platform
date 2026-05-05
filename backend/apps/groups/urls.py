from django.urls import path
from . import views

urlpatterns = [
    path('', views.GroupListView.as_view(), name='group-list'),
    path('<uuid:pk>/', views.GroupDetailView.as_view(), name='group-detail'),
    path('<uuid:pk>/clients/', views.GroupClientsView.as_view(), name='group-clients'),
]
