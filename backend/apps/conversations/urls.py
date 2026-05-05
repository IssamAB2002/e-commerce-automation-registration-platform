from django.urls import path
from . import views

urlpatterns = [
    path('', views.ConversationListView.as_view(), name='conversation-list'),
    path('stats/', views.ConversationStatsView.as_view(), name='conversation-stats'),
    path('<uuid:pk>/', views.ConversationDetailView.as_view(), name='conversation-detail'),
]
