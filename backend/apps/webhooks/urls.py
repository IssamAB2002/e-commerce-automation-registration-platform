from django.urls import path
from . import views

urlpatterns = [
    path('facebook/', views.FacebookWebhookView.as_view(), name='facebook-webhook'),
]
