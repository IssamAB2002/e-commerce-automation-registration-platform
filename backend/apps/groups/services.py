from django.db import transaction
from .models import Group

GROUP_NAMES = [
    'Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta',
    'Iota', 'Kappa', 'Lambda', 'Mu', 'Nu', 'Xi', 'Omicron', 'Pi',
    'Rho', 'Sigma', 'Tau', 'Upsilon', 'Phi', 'Chi', 'Psi', 'Omega',
]

# Prefix per plan tier so group names don't collide across tiers
TIER_PREFIX = {
    Group.STARTER: 'S',
    Group.GROWTH: 'G',
    Group.PRO: 'P',
}


class GroupAssignmentService:
    @staticmethod
    @transaction.atomic
    def assign(client) -> Group:
        plan_tier = client.plan.name if client.plan else Group.STARTER

        # Lock groups for this tier to prevent concurrent race conditions
        active_groups = list(
            Group.objects.filter(plan_tier=plan_tier, is_active=True)
            .select_for_update()
            .order_by('created_at')
        )

        target = None
        for group in active_groups:
            if group.clients.count() < group.capacity:
                target = group
                break

        if target is None:
            target = GroupAssignmentService._create_next_group(plan_tier)

        client.group = target
        client.save(update_fields=['group'])
        return target

    @staticmethod
    def _create_next_group(plan_tier: str) -> Group:
        from django.conf import settings
        prefix = TIER_PREFIX.get(plan_tier, 'X')
        count = Group.objects.filter(plan_tier=plan_tier).count()
        if count < len(GROUP_NAMES):
            name = f'{prefix}-{GROUP_NAMES[count]}'
        else:
            name = f'{prefix}-Group-{count + 1}'

        return Group.objects.create(
            name=name,
            plan_tier=plan_tier,
            n8n_webhook_url=getattr(settings, 'N8N_DEFAULT_WEBHOOK', ''),
            meta_app_id='',
        )
