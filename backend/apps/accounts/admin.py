from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ClientProfile, FacebookPage


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ['-date_joined']
    list_display = ['email', 'first_name', 'last_name', 'is_active', 'is_staff', 'date_joined']
    list_filter = ['is_active', 'is_staff', 'marketing_opt_in']
    search_fields = ['email', 'first_name', 'last_name']
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal', {'fields': ('first_name', 'last_name', 'avatar_url', 'marketing_opt_in')}),
        ('Facebook', {'fields': ('facebook_id', 'facebook_token')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )
    add_fieldsets = (
        (None, {'classes': ('wide',), 'fields': ('email', 'first_name', 'last_name', 'password1', 'password2')}),
    )


@admin.register(ClientProfile)
class ClientProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'company_name', 'plan', 'group', 'is_onboarded', 'is_active', 'created_at']
    list_filter = ['plan', 'group', 'is_onboarded', 'is_active', 'business_niche']
    search_fields = ['user__email', 'company_name', 'phone']
    raw_id_fields = ['user', 'plan', 'group']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(FacebookPage)
class FacebookPageAdmin(admin.ModelAdmin):
    list_display = ['page_name', 'page_id', 'client', 'is_connected', 'connected_at']
    list_filter = ['is_connected']
    search_fields = ['page_name', 'page_id', 'client__user__email']
