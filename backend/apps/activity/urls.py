from django.urls import path
from . import views

urlpatterns = [
    path('me/activity/', views.ActivityLogListView.as_view(), name='activity-list'),
]
