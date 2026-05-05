from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from .models import Plan, ActivationCode
from .serializers import PlanSerializer, SubscriptionSerializer


class PlanListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        plans = Plan.objects.filter(is_active=True)
        serializer = PlanSerializer(plans, many=True)
        return Response({'results': serializer.data})


class MySubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            sub = request.user.profile.subscription
            serializer = SubscriptionSerializer(sub)
            return Response(serializer.data)
        except Exception:
            return Response({'error': 'No active subscription.'}, status=404)


class ValidateCodeView(APIView):
    """Called by Make.com to verify a client's activation code."""
    permission_classes = [AllowAny]

    def post(self, request):
        code_str = request.data.get('code', '').strip().upper()
        if not code_str:
            return Response({'valid': False, 'reason': 'No code provided.'}, status=400)

        try:
            code = ActivationCode.objects.select_related('client__plan').get(code=code_str)
        except ActivationCode.DoesNotExist:
            return Response({'valid': False, 'reason': 'Code not found.'})

        if not code.is_valid:
            return Response({'valid': False, 'reason': 'Code has been invalidated.'})

        from django.utils import timezone
        if code.expires_at and code.expires_at < timezone.now():
            return Response({'valid': False, 'reason': 'Code has expired.'})

        return Response({
            'valid': True,
            'client_id': str(code.client.user.id),
            'plan': code.client.plan.name if code.client.plan else None,
        })


class UpgradePlanView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        plan_name = request.data.get('plan')
        billing_cycle = request.data.get('billing_cycle', 'monthly')

        try:
            plan = Plan.objects.get(name=plan_name, is_active=True)
        except Plan.DoesNotExist:
            return Response({'error': 'Invalid plan.'}, status=400)

        try:
            sub = request.user.profile.subscription
            sub.plan = plan
            sub.billing_cycle = billing_cycle
            sub.is_trial = False
            sub.save(update_fields=['plan', 'billing_cycle', 'is_trial'])
            request.user.profile.plan = plan
            request.user.profile.save(update_fields=['plan'])
        except Exception:
            return Response({'error': 'No subscription found.'}, status=404)

        from apps.activity.models import ActivityLog
        ActivityLog.objects.create(
            client=request.user.profile,
            action_type='plan_upgraded',
            description=f'Plan upgraded to {plan.get_name_display()} ({billing_cycle}).',
            metadata={'plan': plan_name, 'billing_cycle': billing_cycle},
        )
        return Response({'success': True, 'plan': plan_name})
