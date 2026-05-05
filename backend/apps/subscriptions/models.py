import uuid
from django.db import models


class Plan(models.Model):
    STARTER = 'starter'
    GROWTH = 'growth'
    PRO = 'pro'
    PLAN_CHOICES = [
        (STARTER, 'Starter'),
        (GROWTH, 'Growth'),
        (PRO, 'Pro'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=20, choices=PLAN_CHOICES, unique=True)
    tagline = models.CharField(max_length=200, blank=True)
    monthly_price = models.DecimalField(max_digits=8, decimal_places=2)
    annual_price = models.DecimalField(max_digits=8, decimal_places=2)
    # None = unlimited (Pro plan)
    max_groups = models.IntegerField(null=True, blank=True)
    max_workflows = models.IntegerField(null=True, blank=True)
    max_meta_apps = models.IntegerField(null=True, blank=True)
    messages_limit = models.IntegerField(default=2000)
    # File upload limit in bytes
    file_upload_limit = models.BigIntegerField(default=5 * 1024 * 1024)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'plans'
        ordering = ['monthly_price']

    def __str__(self):
        return self.get_name_display()


class Subscription(models.Model):
    MONTHLY = 'monthly'
    ANNUAL = 'annual'
    BILLING_CHOICES = [(MONTHLY, 'Monthly'), (ANNUAL, 'Annual')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.OneToOneField(
        'accounts.ClientProfile', on_delete=models.CASCADE, related_name='subscription'
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    billing_cycle = models.CharField(max_length=10, choices=BILLING_CHOICES, default=MONTHLY)
    current_period_start = models.DateField()
    current_period_end = models.DateField()
    is_active = models.BooleanField(default=True)
    is_trial = models.BooleanField(default=True)
    trial_ends_at = models.DateField(null=True, blank=True)
    amount_paid = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    started_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'subscriptions'

    def __str__(self):
        return f'{self.client} — {self.plan} ({self.billing_cycle})'


class ActivationCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.OneToOneField(
        'accounts.ClientProfile', on_delete=models.CASCADE, related_name='activation_code'
    )
    code = models.CharField(max_length=20, unique=True, db_index=True)
    is_valid = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'activation_codes'

    def __str__(self):
        return self.code
