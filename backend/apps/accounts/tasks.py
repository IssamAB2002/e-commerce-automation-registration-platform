import logging
import requests
from celery import shared_task
from django.conf import settings
from django.utils import timezone
from datetime import timedelta

logger = logging.getLogger(__name__)


@shared_task
def refresh_expiring_facebook_page_tokens():
    """
    Run weekly. Re-exchanges user tokens for long-lived page tokens
    for any Facebook pages whose token was last refreshed >50 days ago
    (tokens expire at ~60 days — refresh 10 days early for safety).
    """
    from apps.accounts.models import FacebookPage

    cutoff = timezone.now() - timedelta(days=50)
    pages = FacebookPage.objects.filter(
        is_connected=True,
        connected_at__lt=cutoff,
    ).select_related('client__user')

    refreshed = 0
    failed = 0
    for page in pages:
        user_token = page.client.user.facebook_token
        if not user_token:
            logger.warning('No user token for client %s — cannot refresh page %s', page.client.id, page.page_id)
            failed += 1
            continue

        try:
            # Exchange short-lived user token → long-lived user token
            ll_resp = requests.get(
                f'https://graph.facebook.com/{settings.FB_GRAPH_VERSION}/oauth/access_token',
                params={
                    'grant_type': 'fb_exchange_token',
                    'client_id': settings.FB_APP_ID,
                    'client_secret': settings.FB_APP_SECRET,
                    'fb_exchange_token': user_token,
                },
                timeout=10,
            )
            ll_resp.raise_for_status()
            long_lived_user_token = ll_resp.json().get('access_token', '')
            if not long_lived_user_token:
                raise ValueError('Empty token returned')

            # Fetch updated page tokens under the long-lived user token
            pages_resp = requests.get(
                f'https://graph.facebook.com/{settings.FB_GRAPH_VERSION}/me/accounts',
                params={'access_token': long_lived_user_token},
                timeout=10,
            )
            pages_resp.raise_for_status()
            for p in pages_resp.json().get('data', []):
                if p['id'] == page.page_id:
                    page.page_token = p.get('access_token', page.page_token)
                    page.connected_at = timezone.now()
                    page.save(update_fields=['page_token', 'connected_at'])
                    refreshed += 1
                    break

            # Update the stored user token
            page.client.user.facebook_token = long_lived_user_token
            page.client.user.save(update_fields=['facebook_token'])

        except Exception as exc:
            logger.error('Failed to refresh token for page %s: %s', page.page_id, exc)
            failed += 1

    logger.info('refresh_expiring_facebook_page_tokens: refreshed=%d failed=%d', refreshed, failed)
    return {'refreshed': refreshed, 'failed': failed}
