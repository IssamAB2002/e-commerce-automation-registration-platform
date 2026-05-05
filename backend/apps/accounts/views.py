import secrets
import hashlib
import hmac
import logging
from urllib.parse import urlencode

import requests as http_requests
from django.conf import settings
from django.shortcuts import redirect
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, ClientProfile, FacebookPage
from .serializers import (
    RegisterSerializer, OnboardingSerializer,
    ClientProfileDetailSerializer, ClientProfileUpdateSerializer,
    FacebookPageSerializer,
)
from .services import create_client, complete_onboarding
from apps.activity.models import ActivityLog

logger = logging.getLogger(__name__)


def _jwt_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


# ── Auth Views ──────────────────────────────────────────────────────────────

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user, profile = create_client(serializer.validated_data)
        tokens = _jwt_for_user(user)
        return Response({
            'success': True,
            'tokens': tokens,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'is_onboarded': profile.is_onboarded,
            },
        }, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').lower().strip()
        password = request.data.get('password', '')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'success': False, 'error': 'Invalid credentials.'},
                            status=status.HTTP_401_UNAUTHORIZED)

        if not user.check_password(password):
            return Response({'success': False, 'error': 'Invalid credentials.'},
                            status=status.HTTP_401_UNAUTHORIZED)

        if not user.is_active:
            return Response({'success': False, 'error': 'Account is disabled.'},
                            status=status.HTTP_401_UNAUTHORIZED)

        tokens = _jwt_for_user(user)
        try:
            is_onboarded = user.profile.is_onboarded
        except ClientProfile.DoesNotExist:
            is_onboarded = False

        return Response({
            'success': True,
            'tokens': tokens,
            'user': {
                'id': str(user.id),
                'email': user.email,
                'first_name': user.first_name,
                'is_onboarded': is_onboarded,
            },
        })


class OnboardingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            profile = request.user.profile
        except ClientProfile.DoesNotExist:
            return Response({'error': 'Client profile not found.'}, status=404)

        if profile.is_onboarded:
            return Response({'error': 'Onboarding already completed.'}, status=400)

        serializer = OnboardingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = complete_onboarding(profile, serializer.validated_data)

        ActivityLog.objects.create(
            client=profile,
            action_type='page_connected',
            description='Client completed onboarding and was assigned to a group.',
        )

        return Response({
            'success': True,
            'message': 'Onboarding complete. You have been assigned to a group.',
        })


# ── Facebook OAuth Views ─────────────────────────────────────────────────────

class FacebookOAuthInitView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        state = secrets.token_urlsafe(16)
        request.session['fb_oauth_state'] = state

        params = {
            'client_id': settings.FB_APP_ID,
            'redirect_uri': settings.FB_REDIRECT_URI,
            'scope': (
                'pages_show_list,pages_messaging,pages_read_engagement,'
                'pages_manage_metadata,public_profile,email'
            ),
            'response_type': 'code',
            'state': state,
        }
        auth_url = f'https://www.facebook.com/{settings.FB_GRAPH_VERSION}/dialog/oauth?{urlencode(params)}'
        # Return URL so frontend can redirect (SPA approach)
        return Response({'auth_url': auth_url})


class FacebookCallbackView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        code = request.query_params.get('code')
        error = request.query_params.get('error')

        if error or not code:
            error_msg = request.query_params.get('error_description', 'Facebook auth cancelled.')
            return redirect(f"{settings.FRONTEND_URL}?auth_error={error_msg}")

        # Exchange code for user access token
        token_resp = http_requests.get(
            f'https://graph.facebook.com/{settings.FB_GRAPH_VERSION}/oauth/access_token',
            params={
                'client_id': settings.FB_APP_ID,
                'client_secret': settings.FB_APP_SECRET,
                'redirect_uri': settings.FB_REDIRECT_URI,
                'code': code,
            },
            timeout=10,
        )

        if token_resp.status_code != 200:
            logger.error('FB token exchange failed: %s', token_resp.text)
            return redirect(f'{settings.FRONTEND_URL}?auth_error=token_exchange_failed')

        user_token = token_resp.json().get('access_token')

        # Get user profile
        profile_resp = http_requests.get(
            f'https://graph.facebook.com/{settings.FB_GRAPH_VERSION}/me',
            params={'fields': 'id,name,email,picture.type(large)', 'access_token': user_token},
            timeout=10,
        )
        fb_profile = profile_resp.json()
        fb_id = fb_profile.get('id')
        fb_email = fb_profile.get('email', '')
        fb_name = fb_profile.get('name', '').split(' ', 1)
        first_name = fb_name[0] if fb_name else ''
        last_name = fb_name[1] if len(fb_name) > 1 else ''
        avatar = fb_profile.get('picture', {}).get('data', {}).get('url', '')

        # Find or create user
        user = None
        if fb_email:
            user = User.objects.filter(email=fb_email).first()

        if not user:
            user = User.objects.filter(facebook_id=fb_id).first()

        if not user:
            user = User.objects.create_user(
                email=fb_email or f'{fb_id}@facebook.placeholder',
                password=None,
                first_name=first_name,
                last_name=last_name,
                facebook_id=fb_id,
                facebook_token=user_token,
                avatar_url=avatar,
            )
            ClientProfile.objects.create(user=user, company_name=f"{first_name}'s Store")
        else:
            user.facebook_id = fb_id
            user.facebook_token = user_token
            if avatar:
                user.avatar_url = avatar
            user.save(update_fields=['facebook_id', 'facebook_token', 'avatar_url'])

        # Fetch and store Facebook Pages
        pages_resp = http_requests.get(
            f'https://graph.facebook.com/{settings.FB_GRAPH_VERSION}/me/accounts',
            params={'access_token': user_token},
            timeout=10,
        )
        if pages_resp.status_code == 200:
            pages_data = pages_resp.json().get('data', [])
            try:
                client_profile = user.profile
                for page in pages_data:
                    FacebookPage.objects.update_or_create(
                        page_id=page['id'],
                        defaults={
                            'client': client_profile,
                            'page_name': page.get('name', ''),
                            'page_token': page.get('access_token', ''),
                            'is_connected': True,
                        },
                    )
            except ClientProfile.DoesNotExist:
                pass

        tokens = _jwt_for_user(user)
        try:
            is_onboarded = user.profile.is_onboarded
        except ClientProfile.DoesNotExist:
            is_onboarded = False

        page_param = 'dashboard' if is_onboarded else 'signup'
        redirect_url = (
            f"{settings.FRONTEND_URL}?page={page_param}"
            f"&access={tokens['access']}&refresh={tokens['refresh']}"
        )
        return redirect(redirect_url)


class FacebookPagesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pages = FacebookPage.objects.filter(client=request.user.profile)
        serializer = FacebookPageSerializer(pages, many=True)
        return Response({'results': serializer.data})

    def post(self, request):
        """Connect a specific page (by page_id) to the client."""
        page_id = request.data.get('page_id')
        try:
            page = FacebookPage.objects.get(page_id=page_id, client=request.user.profile)
            page.is_connected = True
            page.save(update_fields=['is_connected'])
            ActivityLog.objects.create(
                client=request.user.profile,
                action_type='page_connected',
                description=f'Facebook Page "{page.page_name}" connected.',
                metadata={'page_id': page_id},
            )
            return Response({'success': True})
        except FacebookPage.DoesNotExist:
            return Response({'error': 'Page not found.'}, status=404)


class FacebookPageDisconnectView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, page_id):
        try:
            page = FacebookPage.objects.get(page_id=page_id, client=request.user.profile)
            page.is_connected = False
            page.save(update_fields=['is_connected'])
            ActivityLog.objects.create(
                client=request.user.profile,
                action_type='page_disconnected',
                description=f'Facebook Page "{page.page_name}" disconnected.',
            )
            return Response({'success': True})
        except FacebookPage.DoesNotExist:
            return Response({'error': 'Page not found.'}, status=404)


# ── Client Profile Views ─────────────────────────────────────────────────────

class ClientProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.profile
        except ClientProfile.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=404)
        serializer = ClientProfileDetailSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        try:
            profile = request.user.profile
        except ClientProfile.DoesNotExist:
            return Response({'error': 'Profile not found.'}, status=404)
        serializer = ClientProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'success': True})


class ClientActivationCodeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            code = request.user.profile.activation_code
            return Response({
                'code': code.code,
                'is_valid': code.is_valid,
                'created_at': code.created_at,
                'expires_at': code.expires_at,
            })
        except Exception:
            return Response({'error': 'Activation code not found.'}, status=404)


class ClientGroupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        group = request.user.profile.group
        if not group:
            return Response({'error': 'Not yet assigned to a group.'}, status=404)
        return Response({
            'name': group.name,
            'capacity': group.capacity,
            'current_count': group.clients.filter(is_active=True).count(),
            'make_webhook_url': group.make_webhook_url,
            'meta_app_id': group.meta_app_id,
        })
