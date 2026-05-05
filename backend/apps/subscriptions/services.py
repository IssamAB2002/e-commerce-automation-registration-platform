import secrets
import string
from datetime import date, timedelta

from .models import Plan, Subscription, ActivationCode


def generate_activation_code() -> str:
    alphabet = string.ascii_uppercase + string.digits
    segments = [''.join(secrets.choice(alphabet) for _ in range(4)) for _ in range(3)]
    return f'ECA-{"-".join(segments)}'


def create_activation_code(client) -> ActivationCode:
    code = generate_activation_code()
    # Guarantee uniqueness
    while ActivationCode.objects.filter(code=code).exists():
        code = generate_activation_code()
    return ActivationCode.objects.create(client=client, code=code)


def create_starter_subscription(client) -> Subscription:
    try:
        plan = Plan.objects.get(name=Plan.STARTER)
    except Plan.DoesNotExist:
        return None

    today = date.today()
    client.plan = plan
    client.save(update_fields=['plan'])

    return Subscription.objects.create(
        client=client,
        plan=plan,
        billing_cycle=Subscription.MONTHLY,
        current_period_start=today,
        current_period_end=today + timedelta(days=30),
        is_trial=True,
        trial_ends_at=today + timedelta(days=30),
        amount_paid=0,
    )
