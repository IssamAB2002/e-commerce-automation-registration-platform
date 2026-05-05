import logging
from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=5)
def generate_product_description(self, product_id: str):
    """Call Claude API to generate a marketing description for a product."""
    from apps.products.models import Product
    from apps.activity.models import ActivityLog

    try:
        product = Product.objects.select_related('client').get(id=product_id)
    except Product.DoesNotExist:
        logger.error('Product %s not found for description generation.', product_id)
        return

    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        logger.warning('ANTHROPIC_API_KEY not set — skipping AI description.')
        return

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=api_key)
        message = client.messages.create(
            model='claude-sonnet-4-6',
            max_tokens=300,
            messages=[{
                'role': 'user',
                'content': (
                    f'Write a compelling 2-3 sentence product description for an e-commerce store. '
                    f'Product: {product.name}. Category: {product.get_category_display()}. '
                    f'Make it persuasive, friendly, and concise. No markdown, no bullet points.'
                ),
            }],
        )
        product.description = message.content[0].text.strip()
        product.is_ai_generated = True
        product.save(update_fields=['description', 'is_ai_generated'])

        ActivityLog.objects.create(
            client=product.client,
            action_type='ai_description',
            description=f'AI description generated for "{product.name}".',
            metadata={'product_id': product_id},
        )
        logger.info('AI description generated for product %s', product_id)
    except Exception as exc:
        logger.exception('Failed to generate AI description for %s', product_id)
        raise self.retry(exc=exc)
