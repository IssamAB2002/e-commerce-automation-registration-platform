import uuid
from django.db import models


class Product(models.Model):
    CATEGORIES = [
        ('fashion', 'Fashion'),
        ('beauty', 'Beauty'),
        ('electronics', 'Electronics'),
        ('kids', 'Kids'),
        ('home', 'Home & Living'),
        ('sports', 'Sports'),
        ('food', 'Food & Beverages'),
        ('other', 'Other'),
    ]
    STATUS_CHOICES = [('active', 'Active'), ('draft', 'Draft')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    client = models.ForeignKey(
        'accounts.ClientProfile', on_delete=models.CASCADE, related_name='products'
    )
    name = models.CharField(max_length=300)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.CharField(max_length=50, choices=CATEGORIES, default='other')
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to='products/%Y/%m/', null=True, blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    is_ai_generated = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['client', 'status']),
            models.Index(fields=['client', 'category']),
        ]

    def __str__(self):
        return f'{self.name} ({self.client})'
