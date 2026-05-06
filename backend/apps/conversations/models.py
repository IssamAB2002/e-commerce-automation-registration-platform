import uuid
from django.db import models


class Conversation(models.Model):
    SENTIMENT_CHOICES = [
        ('positive', 'Positive'),
        ('neutral', 'Neutral'),
        ('negative', 'Negative'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        'accounts.ClientProfile', on_delete=models.CASCADE, related_name='conversations'
    )
    facebook_page = models.ForeignKey(
        'accounts.FacebookPage', on_delete=models.CASCADE, related_name='conversations'
    )
    sender_fb_id = models.CharField(max_length=100)
    sender_name = models.CharField(max_length=200, blank=True)
    topic = models.CharField(max_length=300, blank=True)
    outcome = models.CharField(max_length=300, blank=True)
    sentiment = models.CharField(max_length=10, choices=SENTIMENT_CHOICES, default='neutral')
    message_count = models.IntegerField(default=0)
    last_message_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'conversations'
        ordering = ['-last_message_at']
        indexes = [
            models.Index(fields=['client', 'sentiment']),
            models.Index(fields=['client', 'last_message_at']),
        ]

    def __str__(self):
        return f'{self.client} — {self.sender_fb_id}'


class Message(models.Model):
    DIRECTION_CHOICES = [('inbound', 'Inbound'), ('outbound', 'Outbound')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    direction = models.CharField(max_length=10, choices=DIRECTION_CHOICES)
    text = models.TextField()
    mid = models.CharField(max_length=200, blank=True, db_index=True)
    timestamp = models.DateTimeField()
    delivered_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messages'
        ordering = ['timestamp']
        constraints = [
            models.UniqueConstraint(
                fields=['mid'],
                condition=models.Q(mid__gt=''),
                name='unique_nonempty_mid',
            )
        ]
