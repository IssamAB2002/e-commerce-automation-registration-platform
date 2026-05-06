from django.urls import path
from . import views
from apps.crm.views import InternalCreateOrderView

urlpatterns = [
    path('messages/outbound/', views.RecordOutboundMessageView.as_view(), name='internal-outbound-message'),
    path('orders/', InternalCreateOrderView.as_view(), name='internal-create-order'),
]
