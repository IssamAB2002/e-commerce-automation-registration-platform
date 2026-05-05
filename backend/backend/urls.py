from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/clients/', include('apps.accounts.client_urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/conversations/', include('apps.conversations.urls')),
    path('api/webhooks/', include('apps.webhooks.urls')),
    path('api/subscriptions/', include('apps.subscriptions.urls')),
    path('api/groups/', include('apps.groups.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
