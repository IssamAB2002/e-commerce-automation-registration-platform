from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView, TokenBlacklistView
from . import views

urlpatterns = [
    path('register/', views.RegisterView.as_view(), name='auth-register'),
    path('login/', views.LoginView.as_view(), name='auth-login'),
    path('onboarding/', views.OnboardingView.as_view(), name='auth-onboarding'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('logout/', TokenBlacklistView.as_view(), name='auth-logout'),
    path('facebook/', views.FacebookOAuthInitView.as_view(), name='facebook-oauth'),
    path('facebook/callback/', views.FacebookCallbackView.as_view(), name='facebook-callback'),
    path('facebook/pages/', views.FacebookPagesView.as_view(), name='facebook-pages'),
    path('facebook/pages/<str:page_id>/', views.FacebookPageDisconnectView.as_view(), name='facebook-page-disconnect'),
]
