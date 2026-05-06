import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'enforce-trial-expirations-daily': {
        'task': 'apps.subscriptions.tasks.enforce_trial_expirations',
        'schedule': crontab(hour=2, minute=0),  # 02:00 UTC every day
    },
    'refresh-facebook-page-tokens-weekly': {
        'task': 'apps.accounts.tasks.refresh_expiring_facebook_page_tokens',
        'schedule': crontab(hour=3, minute=0, day_of_week=1),  # Monday 03:00 UTC
    },
}
