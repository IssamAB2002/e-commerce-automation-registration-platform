from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import status

from .models import Plan, ActivationCode, Subscription, PaymentRequest
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
    """Called by n8n to verify a client's activation code."""
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

        from django.utils import timezone
        from apps.subscriptions.models import MonthlyUsage
        now = timezone.now()
        usage, _ = MonthlyUsage.objects.get_or_create(
            client=code.client,
            year=now.year,
            month=now.month,
            defaults={'messages_used': 0},
        )
        plan = code.client.plan
        messages_limit = plan.messages_limit if plan else 2000
        messages_used = usage.messages_used

        return Response({
            'valid': True,
            'client_id': str(code.client.user.id),
            'plan': plan.name if plan else None,
            'messages_limit': messages_limit,
            'messages_used': messages_used,
            'is_over_limit': messages_used >= messages_limit,
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


class ToggleActivationCodeView(APIView):
    """Allow client to pause or resume their automation by toggling their activation code."""
    permission_classes = [IsAuthenticated]

    def patch(self, request):
        try:
            code = request.user.profile.activation_code
        except ActivationCode.DoesNotExist:
            return Response({'error': 'No activation code found.'}, status=404)

        code.is_valid = not code.is_valid
        code.save(update_fields=['is_valid'])

        from apps.activity.models import ActivityLog
        action = 'AI replies resumed' if code.is_valid else 'AI replies paused'
        ActivityLog.objects.create(
            client=request.user.profile,
            action_type='code_verified',
            description=f'Activation code {action} by client.',
            metadata={'is_valid': code.is_valid},
        )

        return Response({'is_valid': code.is_valid, 'action': action})


# Payment instructions for Baridi Mob / CCP
PAYMENT_INSTRUCTIONS = {
    'account_name': 'EcomAuto SARL',
    'ccp': '00123456789 clé 12',
    'rip': '00799999001234567890 12',
    'note': 'Include your registered email as the transfer description.',
}


class PaymentRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        requests_qs = PaymentRequest.objects.filter(client=request.user.profile)
        data = [
            {
                'id': str(pr.id),
                'plan': pr.plan.name,
                'billing_cycle': pr.billing_cycle,
                'amount_dzd': str(pr.amount_dzd),
                'status': pr.status,
                'transfer_reference': pr.transfer_reference,
                'submitted_at': pr.submitted_at,
            }
            for pr in requests_qs
        ]
        return Response({'results': data, 'payment_instructions': PAYMENT_INSTRUCTIONS})

    def post(self, request):
        plan_name = request.data.get('plan')
        billing_cycle = request.data.get('billing_cycle', 'monthly')
        transfer_reference = request.data.get('transfer_reference', '').strip()
        ccp_or_rip = request.data.get('ccp_or_rip', '').strip()

        if not transfer_reference or not ccp_or_rip:
            return Response({'error': 'transfer_reference and ccp_or_rip are required.'}, status=400)

        try:
            plan = Plan.objects.get(name=plan_name, is_active=True)
        except Plan.DoesNotExist:
            return Response({'error': 'Invalid plan.'}, status=400)

        amount = plan.annual_price if billing_cycle == 'annual' else plan.monthly_price

        pr = PaymentRequest.objects.create(
            client=request.user.profile,
            plan=plan,
            billing_cycle=billing_cycle,
            amount_dzd=amount * 250,  # USD → DZD at 1:250 rate
            ccp_or_rip=ccp_or_rip,
            transfer_reference=transfer_reference,
        )

        # Notify admin about new payment request
        from django.core.mail import send_mail
        from django.conf import settings
        admin_email = getattr(settings, 'ADMIN_EMAIL', '')
        if admin_email:
            try:
                send_mail(
                    subject=f'[EcomAuto] New payment request — {plan.get_name_display()} ({billing_cycle})',
                    message=(
                        f'A new payment request has been submitted.\n\n'
                        f'Client: {request.user.profile.company_name} ({request.user.email})\n'
                        f'Plan: {plan.get_name_display()} / {billing_cycle}\n'
                        f'Amount: {pr.amount_dzd} DZD\n'
                        f'Reference: {transfer_reference}\n'
                        f'CCP/RIP: {ccp_or_rip}\n\n'
                        f'Log in to the admin panel to confirm or reject this request.'
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[admin_email],
                    fail_silently=True,
                )
            except Exception:
                pass

        return Response({
            'success': True,
            'id': str(pr.id),
            'message': 'Payment request submitted. Your account will be activated within 24 hours after confirmation.',
            'payment_instructions': PAYMENT_INSTRUCTIONS,
        }, status=status.HTTP_201_CREATED)
