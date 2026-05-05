from django.db import transaction
from .models import Group

GROUP_NAMES = [
    'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
    'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
    'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega',
]


class GroupAssignmentService:
    @staticmethod
    @transaction.atomic
    def assign(client) -> Group:
        # Lock all active groups to prevent concurrent race conditions
        active_groups = list(
            Group.objects.filter(is_active=True)
            .select_for_update()
            .order_by('created_at')
        )

        target = None
        for group in active_groups:
            if group.clients.count() < group.capacity:
                target = group
                break

        if target is None:
            target = GroupAssignmentService._create_next_group()

        client.group = target
        client.save(update_fields=['group'])
        return target

    @staticmethod
    def _create_next_group() -> Group:
        from django.conf import settings
        count = Group.objects.count()
        if count < len(GROUP_NAMES):
            name = GROUP_NAMES[count]
        else:
            name = f'Group-{count + 1}'

        return Group.objects.create(
            name=name,
            make_webhook_url=getattr(settings, 'MAKE_DEFAULT_WEBHOOK', ''),
            meta_app_id='',
        )
