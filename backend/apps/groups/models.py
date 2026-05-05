import uuid
from django.db import models


class Group(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    capacity = models.IntegerField(default=15)
    make_webhook_url = models.URLField(blank=True)
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
