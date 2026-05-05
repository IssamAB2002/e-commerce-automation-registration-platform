from django.db import transaction
from .models import User, ClientProfile


@transaction.atomic
def create_client(validated_data: dict) -> tuple:
    """Create User + ClientProfile from registration data. Returns (user, profile)."""
    user = User.objects.create_user(
        email=validated_data['email'],
        password=validated_data['password'],
        first_name=validated_data['first_name'],
        last_name=validated_data['last_name'],
        marketing_opt_in=validated_data.get('marketing_opt_in', False),
    )
    profile = ClientProfile.objects.create(
        user=user,
        company_name=validated_data.get('company_name', ''),
        business_type=validated_data.get('business_type', ''),
    )
    return user, profile


@transaction.atomic
def complete_onboarding(profile: ClientProfile, validated_data: dict) -> ClientProfile:
    """Assign group, create activation code, and create starter subscription."""
    from apps.groups.services import GroupAssignmentService
    from apps.subscriptions.services import create_activation_code, create_starter_subscription

    for field, value in validated_data.items():
        setattr(profile, field, value)
    profile.is_onboarded = True
    profile.save()

    GroupAssignmentService.assign(profile)
    create_activation_code(profile)
    create_starter_subscription(profile)

    profile.refresh_from_db()
    return profile
