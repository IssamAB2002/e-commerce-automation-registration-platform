from rest_framework import serializers
from .models import Group


class GroupSerializer(serializers.ModelSerializer):
    current_count = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'capacity', 'current_count', 'is_full',
            'make_webhook_url', 'meta_app_id', 'is_active', 'created_at',
        ]
