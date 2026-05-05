from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, ClientProfile, FacebookPage


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'avatar_url', 'date_joined']
        read_only_fields = ['id', 'date_joined']


class RegisterSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    company_name = serializers.CharField(max_length=200)
    business_type = serializers.CharField(max_length=100, required=False, default='')
    password = serializers.CharField(write_only=True, min_length=8)
    marketing_opt_in = serializers.BooleanField(default=False)

    def validate_email(self, value):
        if User.objects.filter(email=value.lower()).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value.lower()

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        from apps.accounts.services import create_client
        return create_client(validated_data)


class OnboardingSerializer(serializers.Serializer):
    business_niche = serializers.CharField(max_length=100)
    monthly_ad_spend = serializers.CharField(max_length=50)
    primary_goal = serializers.CharField(max_length=100)
    team_size = serializers.CharField(max_length=50)
    phone = serializers.CharField(max_length=30)
    website_url = serializers.URLField(required=False, allow_blank=True)

    def update(self, profile, validated_data):
        for field, value in validated_data.items():
            setattr(profile, field, value)
        profile.is_onboarded = True
        profile.save()
        return profile


class FacebookPageSerializer(serializers.ModelSerializer):
    class Meta:
        model = FacebookPage
        fields = ['page_id', 'page_name', 'is_connected', 'connected_at', 'last_activity']


class GroupInfoSerializer(serializers.Serializer):
    name = serializers.CharField()
    capacity = serializers.IntegerField()
    current_count = serializers.IntegerField()


class SubscriptionInfoSerializer(serializers.Serializer):
    billing_cycle = serializers.CharField()
    current_period_end = serializers.DateField()
    is_trial = serializers.BooleanField()


class UsageSerializer(serializers.Serializer):
    messages_sent = serializers.IntegerField()
    messages_limit = serializers.IntegerField()
    conversations = serializers.IntegerField()
    products_listed = serializers.IntegerField()
    avg_reply_time_seconds = serializers.FloatField()


class AutomationStatusSerializer(serializers.Serializer):
    ai_agent = serializers.CharField()
    facebook_page_connected = serializers.BooleanField()
    message_handler = serializers.CharField()
    group_capacity_used = serializers.IntegerField()
    group_capacity_max = serializers.IntegerField()


class ClientProfileDetailSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    avatar_url = serializers.URLField(source='user.avatar_url', read_only=True)
    plan = serializers.SerializerMethodField()
    group = serializers.SerializerMethodField()
    use_code = serializers.SerializerMethodField()
    subscription = serializers.SerializerMethodField()
    usage = serializers.SerializerMethodField()
    automation_status = serializers.SerializerMethodField()

    class Meta:
        model = ClientProfile
        fields = [
            'id', 'email', 'first_name', 'last_name', 'avatar_url',
            'company_name', 'business_type', 'business_niche',
            'monthly_ad_spend', 'primary_goal', 'team_size',
            'phone', 'website_url', 'is_onboarded', 'created_at',
            'plan', 'group', 'use_code', 'subscription', 'usage', 'automation_status',
        ]
        read_only_fields = ['id', 'created_at']

    def get_plan(self, obj):
        if obj.plan:
            return {'name': obj.plan.name, 'display': obj.plan.get_name_display()}
        return None

    def get_group(self, obj):
        if obj.group:
            return {
                'name': obj.group.name,
                'capacity': obj.group.capacity,
                'current_count': obj.group.clients.filter(is_active=True).count(),
            }
        return None

    def get_use_code(self, obj):
        try:
            return obj.activation_code.code
        except Exception:
            return None

    def get_subscription(self, obj):
        try:
            sub = obj.subscription
            return {
                'billing_cycle': sub.billing_cycle,
                'current_period_end': sub.current_period_end,
                'is_trial': sub.is_trial,
            }
        except Exception:
            return None

    def get_usage(self, obj):
        from django.utils import timezone
        messages_limit = obj.plan.messages_limit if obj.plan else 0
        messages_sent = obj.conversations.aggregate(
            total=__import__('django.db.models', fromlist=['Sum']).Sum('message_count')
        )['total'] or 0
        conversations = obj.conversations.count()
        products = obj.products.filter(status='active').count()
        return {
            'messages_sent': messages_sent,
            'messages_limit': messages_limit,
            'conversations': conversations,
            'products_listed': products,
            'avg_reply_time_seconds': 0.0,
        }

    def get_automation_status(self, obj):
        page_connected = obj.pages.filter(is_connected=True).exists()
        group_count = obj.group.clients.filter(is_active=True).count() if obj.group else 0
        group_max = obj.group.capacity if obj.group else 0
        return {
            'ai_agent': 'online' if page_connected else 'offline',
            'facebook_page_connected': page_connected,
            'message_handler': 'running' if page_connected else 'idle',
            'group_capacity_used': group_count,
            'group_capacity_max': group_max,
        }


class ClientProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = [
            'company_name', 'business_type', 'business_niche',
            'monthly_ad_spend', 'primary_goal', 'team_size',
            'phone', 'website_url',
        ]
