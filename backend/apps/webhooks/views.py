import hashlib
import hmac
import json
import logging

from django.conf import settings
from django.http import HttpResponse
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import WebhookLog
from .tasks import process_facebook_message

logger = logging.getLogger(__name__)


class FacebookWebhookView(APIView):
    permission_classes = [AllowAny]
    # Disable CSRF for webhook endpoint
    authentication_classes = []

    def get(self, request):
        """Meta sends a GET to verify the webhook endpoint."""
        mode = request.query_params.get('hub.mode')
        token = request.query_params.get('hub.verify_token')
        challenge = request.query_params.get('hub.challenge')

        if mode == 'subscribe' and token == settings.FB_WEBHOOK_VERIFY_TOKEN:
            logger.info('Facebook webhook verified successfully.')
            return HttpResponse(challenge, content_type='text/plain', status=200)

        logger.warning('Facebook webhook verification failed. Token mismatch.')
        return HttpResponse('Forbidden', status=403)

    def post(self, request):
        """
        Meta posts all incoming Messenger events here.
        Must return 200 immediately; processing is async via Celery.
        """
        # Validate HMAC signature
        sig_header = request.headers.get('X-Hub-Signature-256', '')
        if not self._verify_signature(request.body, sig_header):
            logger.warning('Invalid webhook signature received.')
            return HttpResponse('Invalid signature', status=403)

        try:
            payload = json.loads(request.body)
        except json.JSONDecodeError:
            return HttpResponse('Bad request', status=400)

        if payload.get('object') != 'page':
            return HttpResponse('OK', status=200)

        # Log the raw event
        entry = payload.get('entry', [{}])[0]
        messaging = entry.get('messaging', [{}])[0]
        page_id = entry.get('id', '')
        sender_id = messaging.get('sender', {}).get('id', '')

        log = WebhookLog.objects.create(
            page_id=page_id,
            sender_id=sender_id,
            payload=payload,
            status='received',
        )

        # Dispatch async processing — respond 200 immediately to Meta
        process_facebook_message.delay(payload, str(log.id))

        return HttpResponse('EVENT_RECEIVED', status=200)

    @staticmethod
    def _verify_signature(body: bytes, sig_header: str) -> bool:
        if not sig_header.startswith('sha256='):
            return False
        expected = hmac.new(
            settings.FB_APP_SECRET.encode(),
            body,
            digestmod=hashlib.sha256,
        ).hexdigest()
        received = sig_header[len('sha256='):]
        return hmac.compare_digest(expected, received)
