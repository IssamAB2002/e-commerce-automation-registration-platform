from rest_framework.permissions import BasePermission


class IsClientOwner(BasePermission):
    """Object-level permission: object.client must equal the requesting user's profile."""
    def has_object_permission(self, request, view, obj):
        try:
            return obj.client == request.user.profile
        except AttributeError:
            return False


class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_staff)


class IsOnboarded(BasePermission):
    """Client must have completed onboarding before accessing protected resources."""
    message = 'Please complete onboarding first.'

    def has_permission(self, request, view):
        try:
            return request.user.profile.is_onboarded
        except AttributeError:
            return False
