from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def health_check(request):
    from django.db import connection
    from django.core.cache import cache
    db_ok = False
    redis_ok = False
    try:
        connection.ensure_connection()
        db_ok = True
    except Exception:
        pass
    try:
        cache.set('_health', '1', timeout=5)
        redis_ok = cache.get('_health') == '1'
    except Exception:
        pass
    status = 200 if db_ok and redis_ok else 503
    return JsonResponse({'status': 'ok' if status == 200 else 'degraded', 'db': db_ok, 'redis': redis_ok}, status=status)


urlpatterns = [
    path('api/health/', health_check, name='health-check'),
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/clients/', include('apps.accounts.client_urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/conversations/', include('apps.conversations.urls')),
    path('api/webhooks/', include('apps.webhooks.urls')),
    path('api/subscriptions/', include('apps.subscriptions.urls')),
    path('api/groups/', include('apps.groups.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/crm/', include('apps.crm.urls')),
    path('api/internal/', include('apps.internal.urls')),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
