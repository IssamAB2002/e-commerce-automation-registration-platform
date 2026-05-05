import uuid
from django.db import models


class DailyUsageSnapshot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        'accounts.ClientProfile', on_delete=models.CASCADE, related_name='snapshots'
    )
    date = models.DateField()
    messages_sent = models.IntegerField(default=0)
    conversations = models.IntegerField(default=0)
    products_listed = models.IntegerField(default=0)
    avg_reply_time_seconds = models.FloatField(null=True, blank=True)

    class Meta:
        db_table = 'daily_usage_snapshots'
        unique_together = [['client', 'date']]
        ordering = ['-date']

    def __str__(self):
        return f'{self.client} — {self.date}'
