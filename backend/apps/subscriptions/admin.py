from django.contrib import admin
from .models import Plan, Subscription, ActivationCode


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'monthly_price', 'annual_price', 'messages_limit', 'max_groups', 'is_active']
    list_editable = ['monthly_price', 'annual_price', 'is_active']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['client', 'plan', 'billing_cycle', 'is_active', 'is_trial', 'current_period_end']
    list_filter = ['plan', 'billing_cycle', 'is_trial', 'is_active']
    search_fields = ['client__user__email', 'client__company_name']
    raw_id_fields = ['client', 'plan']


@admin.register(ActivationCode)
class ActivationCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'client', 'is_valid', 'created_at', 'expires_at']
    list_filter = ['is_valid']
    search_fields = ['code', 'client__user__email']
    raw_id_fields = ['client']
