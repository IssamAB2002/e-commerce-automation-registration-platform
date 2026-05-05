from rest_framework import serializers
from .models import Plan, Subscription, ActivationCode


class PlanSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(source='get_name_display', read_only=True)

    class Meta:
        model = Plan
        fields = [
            'id', 'name', 'display_name', 'tagline',
            'monthly_price', 'annual_price',
            'max_groups', 'max_workflows', 'max_meta_apps',
            'messages_limit', 'file_upload_limit',
        ]


class SubscriptionSerializer(serializers.ModelSerializer):
    plan = PlanSerializer(read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'id', 'plan', 'billing_cycle',
            'current_period_start', 'current_period_end',
            'is_active', 'is_trial', 'trial_ends_at', 'amount_paid', 'started_at',
        ]


class ActivationCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivationCode
        fields = ['code', 'is_valid', 'created_at', 'expires_at']
