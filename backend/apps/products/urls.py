from django.urls import path
from . import views

urlpatterns = [
    path('', views.ProductListCreateView.as_view(), name='product-list'),
    path('<uuid:pk>/', views.ProductDetailView.as_view(), name='product-detail'),
    path('<uuid:pk>/status/', views.ProductStatusToggleView.as_view(), name='product-status'),
    path('<uuid:pk>/generate-description/', views.ProductGenerateDescriptionView.as_view(), name='product-ai-description'),
]
