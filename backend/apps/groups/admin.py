from django.contrib import admin
from .models import Group


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'current_count', 'capacity', 'make_webhook_url', 'meta_app_id', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name', 'meta_app_id']
    list_editable = ['make_webhook_url', 'meta_app_id', 'is_active']
