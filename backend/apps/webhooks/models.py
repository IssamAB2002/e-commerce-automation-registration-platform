import uuid
from django.db import models


class WebhookLog(models.Model):
    STATUS_CHOICES = [
        ('received', 'Received'),
        ('forwarded', 'Forwarded'),
        ('failed', 'Failed'),
        ('retrying', 'Retrying'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    page_id = models.CharField(max_length=100, db_index=True)
    sender_id = models.CharField(max_length=100, blank=True)
    payload = models.JSONField()
    forwarded_to = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='received')
    attempts = models.IntegerField(default=0)
    error_detail = models.TextField(blank=True)
    received_at = models.DateTimeField(auto_now_add=True)
    forwarded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'webhook_logs'
        ordering = ['-received_at']
        indexes = [
            models.Index(fields=['page_id', 'received_at']),
            models.Index(fields=['status']),
        ]

    def __str__(self):
        return f'{self.page_id} — {self.status} @ {self.received_at}'
