from django.urls import path
from . import views

urlpatterns = [
    path('plans/', views.PlanListView.as_view(), name='plan-list'),
    path('me/', views.MySubscriptionView.as_view(), name='my-subscription'),
    path('validate-code/', views.ValidateCodeView.as_view(), name='validate-code'),
    path('upgrade/', views.UpgradePlanView.as_view(), name='upgrade-plan'),
    path('activation-code/toggle/', views.ToggleActivationCodeView.as_view(), name='activation-code-toggle'),
    path('payment-request/', views.PaymentRequestView.as_view(), name='payment-request'),
]
