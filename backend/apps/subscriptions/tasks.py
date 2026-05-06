import logging
from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def enforce_trial_expirations():
    """
    Run daily. Deactivate any trial subscriptions that have passed their trial_ends_at date.
    Sets Subscription.is_active=False, ClientProfile.is_active=False, ActivationCode.is_valid=False.
    """
    from apps.subscriptions.models import Subscription, ActivationCode
    from apps.activity.models import ActivityLog

    now = timezone.now().date()
    expired_subs = Subscription.objects.filter(
        is_trial=True,
        is_active=True,
        trial_ends_at__lt=now,
    ).select_related('client')

    count = 0
    for sub in expired_subs:
        client = sub.client

        sub.is_active = False
        sub.save(update_fields=['is_active'])

        client.is_active = False
        client.save(update_fields=['is_active'])

        ActivationCode.objects.filter(client=client).update(is_valid=False)

        ActivityLog.objects.create(
            client=client,
            action_type='trial_expired',
            description='Free trial ended. Account suspended until payment is confirmed.',
            metadata={'trial_ended_at': str(now)},
        )
        count += 1

    logger.info('enforce_trial_expirations: suspended %d expired trial accounts.', count)
    return count
