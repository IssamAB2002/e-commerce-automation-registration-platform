from django.core.management.base import BaseCommand
from django.conf import settings
from apps.subscriptions.models import Plan
from apps.groups.models import Group


class Command(BaseCommand):
    help = 'Seed the database with the 3 plans and the first group.'

    def handle(self, *args, **options):
        self._seed_plans()
        self._seed_group()

    def _seed_plans(self):
        plans = [
            {
                'name': Plan.STARTER,
                'tagline': 'Perfect for getting started',
                'monthly_price': 49,
                'annual_price': 39,
                'max_groups': 1,
                'max_workflows': 1,
                'max_meta_apps': 1,
                'messages_limit': 2000,
                'file_upload_limit': 5 * 1024 * 1024,
            },
            {
                'name': Plan.GROWTH,
                'tagline': 'For growing businesses',
                'monthly_price': 149,
                'annual_price': 119,
                'max_groups': 3,
                'max_workflows': 3,
                'max_meta_apps': 3,
                'messages_limit': 15000,
                'file_upload_limit': 50 * 1024 * 1024,
            },
            {
                'name': Plan.PRO,
                'tagline': 'Unlimited scale',
                'monthly_price': 349,
                'annual_price': 279,
                'max_groups': None,
                'max_workflows': None,
                'max_meta_apps': None,
                'messages_limit': 100000,
                'file_upload_limit': 500 * 1024 * 1024,
            },
        ]

        for plan_data in plans:
            plan, created = Plan.objects.update_or_create(
                name=plan_data['name'],
                defaults=plan_data,
            )
            status = 'Created' if created else 'Updated'
            self.stdout.write(self.style.SUCCESS(f'{status} plan: {plan.get_name_display()}'))

    def _seed_group(self):
        if Group.objects.exists():
            self.stdout.write('Groups already exist — skipping.')
            return

        make_url = getattr(settings, 'MAKE_DEFAULT_WEBHOOK', '')
        group = Group.objects.create(
            name='Alpha',
            capacity=15,
            make_webhook_url=make_url,
            meta_app_id='',
        )
        self.stdout.write(self.style.SUCCESS(f'Created initial group: {group.name}'))
        self.stdout.write(
            self.style.WARNING(
                'Remember to set the Make.com webhook URL and Meta App ID for group Alpha '
                'in the Django admin or via the MAKE_DEFAULT_WEBHOOK env variable.'
            )
        )
