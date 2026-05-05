import uuid
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from .managers import UserManager


class User(AbstractBaseUser, PermissionsMixin):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_joined = models.DateTimeField(auto_now_add=True)

    # Facebook OAuth
    facebook_id = models.CharField(max_length=100, null=True, blank=True, db_index=True)
    facebook_token = models.TextField(null=True, blank=True)
    avatar_url = models.URLField(null=True, blank=True)

    marketing_opt_in = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    class Meta:
        db_table = 'users'
        verbose_name = 'user'
        verbose_name_plural = 'users'

    def __str__(self):
        return self.email

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'.strip()


class ClientProfile(models.Model):
    BUSINESS_TYPES = [
        ('ecommerce', 'E-commerce'),
        ('retail', 'Retail'),
        ('services', 'Services'),
        ('other', 'Other'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    company_name = models.CharField(max_length=200)
    business_type = models.CharField(max_length=100, blank=True)
    business_niche = models.CharField(max_length=100, blank=True)
    monthly_ad_spend = models.CharField(max_length=50, blank=True)
    primary_goal = models.CharField(max_length=100, blank=True)
    team_size = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=30, blank=True)
    website_url = models.URLField(null=True, blank=True)

    plan = models.ForeignKey(
        'subscriptions.Plan', on_delete=models.PROTECT,
        null=True, blank=True, related_name='clients'
    )
    group = models.ForeignKey(
        'groups.Group', on_delete=models.SET_NULL,
        null=True, blank=True, related_name='clients'
    )

    is_onboarded = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'client_profiles'

    def __str__(self):
        return f'{self.user.email} — {self.company_name}'


class FacebookPage(models.Model):
    client = models.ForeignKey(ClientProfile, on_delete=models.CASCADE, related_name='pages')
    page_id = models.CharField(max_length=100, unique=True, db_index=True)
    page_name = models.CharField(max_length=200)
    page_token = models.TextField()
    is_connected = models.BooleanField(default=True)
    connected_at = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'facebook_pages'

    def __str__(self):
        return f'{self.page_name} ({self.page_id})'
