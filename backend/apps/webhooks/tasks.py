import logging
from datetime import datetime, timezone
from celery import shared_task
from django.conf import settings
from django.db.models import F

import httpx

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def process_facebook_message(self, payload: dict, log_id: str = None):
    """
    Route an incoming Facebook Messenger event to the correct Make.com webhook.
    Called immediately after returning 200 to Meta.
    """
    from apps.accounts.models import FacebookPage
    from apps.conversations.models import Conversation, Message
    from apps.activity.models import ActivityLog
    from apps.webhooks.models import WebhookLog

    try:
        entry = payload.get('entry', [{}])[0]
        messaging = entry.get('messaging', [{}])[0]
        page_id = entry.get('id', '')
        sender_id = messaging.get('sender', {}).get('id', '')
        message_obj = messaging.get('message', {})
        text = message_obj.get('text', '')
        mid = message_obj.get('mid', '')
        timestamp_ms = messaging.get('timestamp', 0)

        if not page_id or not text:
            logger.debug('Skipping non-message webhook event for page %s', page_id)
            return

        try:
            page = FacebookPage.objects.select_related('client__group').get(page_id=page_id)
        except FacebookPage.DoesNotExist:
            logger.warning('Received message for unknown page_id: %s', page_id)
            if log_id:
                WebhookLog.objects.filter(id=log_id).update(
                    status='failed', error_detail='Unknown page_id'
                )
            return

        client = page.client
        group = client.group
        webhook_url = (
            group.make_webhook_url
            if group and group.make_webhook_url
            else settings.MAKE_DEFAULT_WEBHOOK
        )

        forward_payload = {
            'sender_id': sender_id,
            'page_id': page_id,
            'page_token': page.page_token,
            'message_text': text,
            'timestamp': timestamp_ms,
            'client_id': str(client.user.id),
            'group_name': group.name if group else None,
        }

        with httpx.Client(timeout=10) as http:
            response = http.post(webhook_url, json=forward_payload)
            response.raise_for_status()

        # Record the conversation + message
        msg_time = datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc)
        convo, created = Conversation.objects.get_or_create(
            client=client,
            facebook_page=page,
            sender_fb_id=sender_id,
        )
        Message.objects.create(
            conversation=convo,
            direction='inbound',
            text=text,
            mid=mid,
            timestamp=msg_time,
        )
        convo.message_count = F('message_count') + 1
        convo.last_message_at = msg_time
        convo.save(update_fields=['message_count', 'last_message_at'])

        if created:
            ActivityLog.objects.create(
                client=client,
                action_type='conversation_started',
                description=f'New conversation from sender {sender_id}.',
                metadata={'sender_id': sender_id, 'page_id': page_id},
            )

        if log_id:
            from django.utils import timezone as tz
            WebhookLog.objects.filter(id=log_id).update(
                status='forwarded',
                forwarded_to=webhook_url,
                forwarded_at=tz.now(),
                attempts=F('attempts') + 1,
            )

        logger.info('Message from %s forwarded to %s', sender_id, webhook_url)

    except Exception as exc:
        logger.exception('Failed to process Facebook message: %s', exc)
        if log_id:
            from django.db.models import F as dbF
            WebhookLog.objects.filter(id=log_id).update(
                status='retrying',
                attempts=dbF('attempts') + 1,
                error_detail=str(exc),
            )
        raise self.retry(exc=exc)
