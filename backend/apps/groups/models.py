import uuid
from django.db import models


class Group(models.Model):
    STARTER = 'starter'
    GROWTH = 'growth'
    PRO = 'pro'
    ANY = 'any'
    PLAN_TIER_CHOICES = [
        (STARTER, 'Starter'),
        (GROWTH, 'Growth'),
        (PRO, 'Pro'),
        (ANY, 'Any'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    plan_tier = models.CharField(max_length=10, choices=PLAN_TIER_CHOICES, default=STARTER, db_index=True)
    capacity = models.IntegerField(default=15)
    n8n_webhook_url = models.URLField(blank=True)
    meta_app_id = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'groups'
        ordering = ['created_at']

    def __str__(self):
        return self.name

    @property
    def current_count(self):
        return self.clients.filter(is_active=True).count()

    @property
    def is_full(self):
        return self.current_count >= self.capacity
