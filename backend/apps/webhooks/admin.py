from django.contrib import admin
from .models import WebhookLog


@admin.register(WebhookLog)
class WebhookLogAdmin(admin.ModelAdmin):
    list_display = ['page_id', 'sender_id', 'status', 'attempts', 'received_at', 'forwarded_at']
    list_filter = ['status', 'received_at']
    search_fields = ['page_id', 'sender_id']
    readonly_fields = ['id', 'payload', 'received_at', 'forwarded_at']
