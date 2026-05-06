import logging
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=2, default_retry_delay=10)
def classify_and_summarize_conversation(self, conversation_id: str):
    """
    After a conversation has new messages, call Gemini to:
    1. Classify sentiment (positive / neutral / negative)
    2. Write a 1-sentence topic summary
    3. Write a 1-sentence outcome summary
    Updates Conversation.sentiment, .topic, and .outcome.
    """
    from apps.conversations.models import Conversation, Message

    try:
        convo = Conversation.objects.prefetch_related('messages').get(id=conversation_id)
    except Conversation.DoesNotExist:
        logger.warning('Conversation %s not found for classification.', conversation_id)
        return

    messages = convo.messages.order_by('timestamp')
    if not messages.exists():
        return

    api_key = getattr(settings, 'GEMINI_API_KEY', None)
    if not api_key:
        logger.warning('GEMINI_API_KEY not set — skipping conversation classification.')
        return

    transcript = '\n'.join(
        f"{'Customer' if m.direction == 'inbound' else 'Bot'}: {m.text}"
        for m in messages
    )

    prompt = (
        'Analyze this Facebook Messenger conversation between a customer and an AI sales bot.\n\n'
        f'{transcript}\n\n'
        'Respond with exactly 3 lines (no extra text, no labels):\n'
        'Line 1: Sentiment — one word only: positive, neutral, or negative\n'
        'Line 2: Topic — one sentence describing what the customer was asking about\n'
        'Line 3: Outcome — one sentence describing how the conversation ended\n'
    )

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.0-flash')
        response = model.generate_content(prompt)
        lines = [l.strip() for l in response.text.strip().splitlines() if l.strip()]

        if len(lines) >= 1:
            raw_sentiment = lines[0].lower()
            if raw_sentiment in ('positive', 'neutral', 'negative'):
                convo.sentiment = raw_sentiment

        if len(lines) >= 2:
            convo.topic = lines[1][:300]

        if len(lines) >= 3:
            convo.outcome = lines[2][:300]

        convo.save(update_fields=['sentiment', 'topic', 'outcome'])
        logger.info('Conversation %s classified as %s', conversation_id, convo.sentiment)

    except Exception as exc:
        logger.exception('Failed to classify conversation %s: %s', conversation_id, exc)
        raise self.retry(exc=exc)
