from django.urls import path
from . import views

urlpatterns = [
    path('orders/', views.OrderListCreateView.as_view(), name='order-list'),
    path('orders/stats/', views.OrderStatsView.as_view(), name='order-stats'),
    path('orders/<uuid:pk>/', views.OrderDetailView.as_view(), name='order-detail'),
]
