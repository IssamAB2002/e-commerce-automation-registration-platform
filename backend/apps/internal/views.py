import logging
from django.conf import settings
from django.db.models import F
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status

logger = logging.getLogger(__name__)


def _check_internal_key(request):
    secret = getattr(settings, 'INTERNAL_API_SECRET', None)
    if not secret:
        return False
    return request.headers.get('X-Internal-Key') == secret


class RecordOutboundMessageView(APIView):
    """
    Called by n8n after sending a Messenger reply.
    Records the outbound message and triggers Gemini classification.
    Secured by X-Internal-Key header.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        if not _check_internal_key(request):
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_401_UNAUTHORIZED)

        conversation_id = request.data.get('conversation_id')
        text = request.data.get('text', '')
        mid = request.data.get('mid', '')
        timestamp_str = request.data.get('timestamp')

        if not conversation_id or not text:
            return Response({'error': 'conversation_id and text are required.'}, status=400)

        from apps.conversations.models import Conversation, Message
        from apps.subscriptions.models import MonthlyUsage

        try:
            convo = Conversation.objects.select_related('client').get(id=conversation_id)
        except Conversation.DoesNotExist:
            return Response({'error': 'Conversation not found.'}, status=404)

        now = timezone.now()
        msg_time = now
        if timestamp_str:
            from django.utils.dateparse import parse_datetime
            parsed = parse_datetime(timestamp_str)
            if parsed:
                msg_time = parsed

        Message.objects.create(
            conversation=convo,
            direction='outbound',
            text=text,
            mid=mid,
            timestamp=msg_time,
        )

        convo.message_count = F('message_count') + 1
        convo.last_message_at = msg_time
        convo.save(update_fields=['message_count', 'last_message_at'])

        # Increment monthly usage for outbound messages
        MonthlyUsage.objects.filter(
            client=convo.client,
            year=now.year,
            month=now.month,
        ).update(messages_used=F('messages_used') + 1)

        # Trigger Gemini classification 90s later (debounced)
        from apps.conversations.tasks import classify_and_summarize_conversation
        classify_and_summarize_conversation.apply_async(
            args=[str(convo.id)], countdown=90
        )

        logger.info('Recorded outbound message for conversation %s', conversation_id)
        return Response({'success': True})
