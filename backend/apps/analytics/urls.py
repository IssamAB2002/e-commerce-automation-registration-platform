from django.urls import path
from . import views

urlpatterns = [
    path('me/', views.MyAnalyticsView.as_view(), name='my-analytics'),
    path('me/daily/', views.DailyAnalyticsView.as_view(), name='daily-analytics'),
]
