from django.contrib import admin
from django.utils import timezone
from .models import Plan, Subscription, ActivationCode, PaymentRequest


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'monthly_price', 'annual_price', 'messages_limit', 'max_groups', 'is_active']
    list_editable = ['monthly_price', 'annual_price', 'is_active']


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['client', 'plan', 'billing_cycle', 'is_active', 'is_trial', 'current_period_end']
    list_filter = ['plan', 'billing_cycle', 'is_trial', 'is_active']
    search_fields = ['client__user__email', 'client__company_name']
    raw_id_fields = ['client', 'plan']


@admin.register(ActivationCode)
class ActivationCodeAdmin(admin.ModelAdmin):
    list_display = ['code', 'client', 'is_valid', 'created_at', 'expires_at']
    list_filter = ['is_valid']
    search_fields = ['code', 'client__user__email']
    raw_id_fields = ['client']


def confirm_payment(modeladmin, request, queryset):
    from apps.activity.models import ActivityLog
    import datetime

    for pr in queryset.filter(status='pending'):
        client = pr.client
        plan = pr.plan
        now = timezone.now()

        # Activate subscription
        sub, _ = Subscription.objects.get_or_create(
            client=client,
            defaults={
                'plan': plan,
                'billing_cycle': pr.billing_cycle,
                'current_period_start': now.date(),
                'current_period_end': (now + datetime.timedelta(days=365 if pr.billing_cycle == 'annual' else 30)).date(),
                'is_active': True,
                'is_trial': False,
                'amount_paid': pr.amount_dzd,
            },
        )
        if not _:
            period_end = (now + datetime.timedelta(days=365 if pr.billing_cycle == 'annual' else 30)).date()
            sub.plan = plan
            sub.billing_cycle = pr.billing_cycle
            sub.is_active = True
            sub.is_trial = False
            sub.current_period_start = now.date()
            sub.current_period_end = period_end
            sub.amount_paid = pr.amount_dzd
            sub.save()

        client.plan = plan
        client.is_active = True
        client.save(update_fields=['plan', 'is_active'])

        ActivationCode.objects.filter(client=client).update(is_valid=True)

        pr.status = 'confirmed'
        pr.reviewed_at = now
        pr.reviewed_by = request.user
        pr.save(update_fields=['status', 'reviewed_at', 'reviewed_by'])

        ActivityLog.objects.create(
            client=client,
            action_type='plan_upgraded',
            description=f'Payment confirmed. Plan upgraded to {plan.get_name_display()} ({pr.billing_cycle}).',
            metadata={'plan': plan.name, 'billing_cycle': pr.billing_cycle, 'amount_dzd': str(pr.amount_dzd)},
        )

        # Notify client by email
        from django.core.mail import send_mail
        from django.conf import settings
        client_email = client.user.email
        if client_email:
            try:
                send_mail(
                    subject='[EcomAuto] Your payment has been confirmed!',
                    message=(
                        f'Hi {client.company_name},\n\n'
                        f'Great news! Your payment has been confirmed and your account is now active.\n\n'
                        f'Plan: {plan.get_name_display()}\n'
                        f'Billing: {pr.billing_cycle}\n'
                        f'Amount paid: {pr.amount_dzd} DZD\n\n'
                        f'Log in to your dashboard to start using EcomAuto.\n\n'
                        f'Thank you for choosing EcomAuto!'
                    ),
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[client_email],
                    fail_silently=True,
                )
            except Exception:
                pass

    modeladmin.message_user(request, f'Confirmed {queryset.filter(status="confirmed").count()} payment(s).')


confirm_payment.short_description = 'Confirm selected payments and activate subscriptions'


def reject_payment(modeladmin, request, queryset):
    queryset.filter(status='pending').update(
        status='rejected',
        reviewed_at=timezone.now(),
        reviewed_by=request.user,
    )
    modeladmin.message_user(request, 'Selected payments rejected.')


reject_payment.short_description = 'Reject selected payment requests'


@admin.register(PaymentRequest)
class PaymentRequestAdmin(admin.ModelAdmin):
    list_display = ['client', 'plan', 'billing_cycle', 'amount_dzd', 'transfer_reference', 'status', 'submitted_at']
    list_filter = ['status', 'plan', 'billing_cycle']
    search_fields = ['client__user__email', 'transfer_reference', 'ccp_or_rip']
    raw_id_fields = ['client', 'plan']
    readonly_fields = ['submitted_at', 'reviewed_at']
    actions = [confirm_payment, reject_payment]
