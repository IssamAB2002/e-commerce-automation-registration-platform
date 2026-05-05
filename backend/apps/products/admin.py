from django.contrib import admin
from .models import Product


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'client', 'price', 'category', 'status', 'is_ai_generated', 'created_at']
    list_filter = ['status', 'category', 'is_ai_generated']
    search_fields = ['name', 'client__user__email', 'client__company_name']
    raw_id_fields = ['client']
    readonly_fields = ['id', 'created_at', 'updated_at']
