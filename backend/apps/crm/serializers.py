from rest_framework import serializers
from .models import Order


class OrderSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'conversation', 'customer_name', 'customer_phone',
            'delivery_address', 'notes', 'product_name', 'quantity',
            'unit_price', 'total_price', 'status', 'status_display',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'total_price', 'status_display', 'created_at', 'updated_at']
