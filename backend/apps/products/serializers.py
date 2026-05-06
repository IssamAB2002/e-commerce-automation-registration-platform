from rest_framework import serializers
from .models import Product, ProductFile


class ProductSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'price', 'category', 'category_display',
            'description', 'image', 'image_url', 'status', 'is_ai_generated',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'is_ai_generated', 'created_at', 'updated_at']
        extra_kwargs = {'image': {'write_only': True}}

    def get_image_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None


class ProductFileSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductFile
        fields = ['id', 'product', 'original_name', 'file_size', 'file_url', 'uploaded_at']
        read_only_fields = ['id', 'original_name', 'file_size', 'file_url', 'uploaded_at']

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None
