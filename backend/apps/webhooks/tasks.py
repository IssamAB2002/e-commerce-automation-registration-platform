import logging
from datetime import datetime, timezone
from celery import shared_task
from django.conf import settings
from django.db.models import F
from django.utils import timezone as tz

import httpx

logger = logging.getLogger(__name__)


def _get_or_create_monthly_usage(client):
    from apps.subscriptions.models import MonthlyUsage
    now = tz.now()
    usage, _ = MonthlyUsage.objects.get_or_create(
        client=client,
        year=now.year,
        month=now.month,
        defaults={'messages_used': 0},
    )
    return usage


def _is_over_message_limit(client) -> bool:
    if not client.plan:
        return False
    limit = client.plan.messages_limit
    usage = _get_or_create_monthly_usage(client)
    return usage.messages_used >= limit


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def process_facebook_message(self, payload: dict, log_id: str = None):
    """
    Route an incoming Facebook Messenger event to the correct n8n webhook.
    Called immediately after returning 200 to Meta.
    """
    from apps.accounts.models import FacebookPage
    from apps.conversations.models import Conversation, Message
    from apps.activity.models import ActivityLog
    from apps.webhooks.models import WebhookLog
    from apps.subscriptions.models import MonthlyUsage

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
            page = FacebookPage.objects.select_related('client__group', 'client__plan').get(
                page_id=page_id
            )
        except FacebookPage.DoesNotExist:
            logger.warning('Received message for unknown page_id: %s', page_id)
            if log_id:
                WebhookLog.objects.filter(id=log_id).update(
                    status='failed', error_detail='Unknown page_id'
                )
            return

        client = page.client

        # Block if client has hit their monthly message limit
        if _is_over_message_limit(client):
            logger.warning('Message limit exceeded for client %s', client.id)
            if log_id:
                WebhookLog.objects.filter(id=log_id).update(
                    status='failed', error_detail='message_limit_exceeded'
                )
            return

        group = client.group
        webhook_url = (
            group.n8n_webhook_url
            if group and group.n8n_webhook_url
            else settings.N8N_DEFAULT_WEBHOOK
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

        # Increment monthly usage atomically
        MonthlyUsage.objects.filter(
            client=client,
            year=tz.now().year,
            month=tz.now().month,
        ).update(messages_used=F('messages_used') + 1)

        # Record the conversation + message
        msg_time = datetime.fromtimestamp(timestamp_ms / 1000, tz=timezone.utc)

        # Deduplicate by mid — Meta can redeliver the same message on retries
        if mid and Message.objects.filter(mid=mid).exists():
            logger.debug('Duplicate mid %s — skipping.', mid)
            return

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

        # Trigger sentiment classification 90s after the message (debounce rapid exchanges)
        from apps.conversations.tasks import classify_and_summarize_conversation
        classify_and_summarize_conversation.apply_async(
            args=[str(convo.id)], countdown=90
        )

        if log_id:
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
            WebhookLog.objects.filter(id=log_id).update(
                status='retrying',
                attempts=F('attempts') + 1,
                error_detail=str(exc),
            )
        raise self.retry(exc=exc)
