from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'direction', 'text', 'timestamp', 'delivered_at']


class ConversationSerializer(serializers.ModelSerializer):
    sentiment_display = serializers.CharField(source='get_sentiment_display', read_only=True)
    page_name = serializers.CharField(source='facebook_page.page_name', read_only=True)

    class Meta:
        model = Conversation
        fields = [
            'id', 'sender_fb_id', 'sender_name', 'page_name',
            'topic', 'outcome', 'sentiment', 'sentiment_display',
            'message_count', 'last_message_at', 'created_at',
        ]


class ConversationDetailSerializer(ConversationSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + ['messages']
