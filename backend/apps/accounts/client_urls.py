from django.urls import path, include
from . import views

urlpatterns = [
    path('me/', views.ClientProfileView.as_view(), name='client-profile'),
    path('me/code/', views.ClientActivationCodeView.as_view(), name='client-code'),
    path('me/group/', views.ClientGroupView.as_view(), name='client-group'),
    path('me/facebook-pages/', views.FacebookPagesView.as_view(), name='client-pages'),
    path('me/facebook-pages/<str:page_id>/', views.FacebookPageDisconnectView.as_view(), name='client-page-disconnect'),
    path('', include('apps.activity.urls')),
]
