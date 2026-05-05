from django.contrib import admin
from .models import Conversation, Message


@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ['client', 'sender_name', 'sentiment', 'message_count', 'last_message_at']
    list_filter = ['sentiment', 'last_message_at']
    search_fields = ['client__user__email', 'sender_name', 'sender_fb_id', 'topic']
    raw_id_fields = ['client', 'facebook_page']


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ['conversation', 'direction', 'timestamp']
    list_filter = ['direction']
    raw_id_fields = ['conversation']
