import uuid
from django.db import models


class ActivityLog(models.Model):
    ACTION_TYPES = [
        ('conversation_started', 'Conversation Started'),
        ('product_added', 'Product Added'),
        ('product_updated', 'Product Updated'),
        ('product_deleted', 'Product Deleted'),
        ('code_verified', 'Activation Code Verified'),
        ('page_connected', 'Facebook Page Connected'),
        ('page_disconnected', 'Facebook Page Disconnected'),
        ('plan_upgraded', 'Plan Upgraded'),
        ('ai_description', 'AI Description Generated'),
        ('message_sent', 'Message Sent'),
        ('group_assigned', 'Group Assigned'),
        ('trial_expired', 'Trial Expired'),
        ('order_received', 'Order Received'),
        ('order_updated', 'Order Updated'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        'accounts.ClientProfile', on_delete=models.CASCADE, related_name='activity'
    )
    action_type = models.CharField(max_length=50, choices=ACTION_TYPES)
    description = models.CharField(max_length=500)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'activity_logs'
        ordering = ['-created_at']
        indexes = [models.Index(fields=['client', 'created_at'])]

    def __str__(self):
        return f'{self.client} — {self.action_type}'
