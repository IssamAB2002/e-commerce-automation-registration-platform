import logging
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=10)
def notify_client_new_order(self, order_id: str):
    """
    Send a Facebook Messenger notification to the client's first connected page
    when a new order comes in. The client must have previously messaged their own
    page to open the admin notification thread.
    """
    from apps.crm.models import Order
    from apps.accounts.models import FacebookPage
    from apps.activity.models import ActivityLog
    import httpx

    try:
        order = Order.objects.select_related('client').get(id=order_id)
    except Order.DoesNotExist:
        logger.error('Order %s not found for notification.', order_id)
        return

    client = order.client
    page = FacebookPage.objects.filter(client=client, is_connected=True).first()
    if not page:
        logger.warning('Client %s has no connected Facebook Page — skipping notification.', client.id)
        return

    message = (
        f"New order received!\n"
        f"Customer: {order.customer_name}\n"
        f"Phone: {order.customer_phone}\n"
        f"Product: {order.product_name} x{order.quantity}\n"
        f"Total: {order.total_price} DZD\n"
        f"Address: {order.delivery_address}"
    )

    # Send via Page Conversations API — targets the page admin's thread
    graph_url = f'https://graph.facebook.com/{settings.FB_GRAPH_VERSION}/me/messages'
    payload = {
        'recipient': {'id': page.page_id},
        'message': {'text': message},
        'messaging_type': 'MESSAGE_TAG',
        'tag': 'CONFIRMED_EVENT_UPDATE',
    }

    try:
        with httpx.Client(timeout=10) as http:
            resp = http.post(
                graph_url,
                json=payload,
                params={'access_token': page.page_token},
            )
            resp.raise_for_status()

        ActivityLog.objects.create(
            client=client,
            action_type='order_received',
            description=f'New order from {order.customer_name} — {order.product_name}.',
            metadata={'order_id': order_id},
        )
        logger.info('Order notification sent for order %s', order_id)

    except Exception as exc:
        logger.exception('Failed to send order notification for order %s: %s', order_id, exc)
        raise self.retry(exc=exc)
