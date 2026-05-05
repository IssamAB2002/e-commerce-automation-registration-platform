from django.db.models import Sum, Count
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import DailyUsageSnapshot


class MyAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile

        # Pull from actual data
        conversations = profile.conversations.count()
        messages_sent = (
            profile.conversations.aggregate(total=Sum('message_count'))['total'] or 0
        )
        products_listed = profile.products.filter(status='active').count()
        messages_limit = profile.plan.messages_limit if profile.plan else 0

        try:
            sub = profile.subscription
            period_start = sub.current_period_start
            period_end = sub.current_period_end
        except Exception:
            today = timezone.now().date()
            period_start = today.replace(day=1)
            period_end = today

        return Response({
            'ai_conversations': conversations,
            'messages_sent': messages_sent,
            'messages_limit': messages_limit,
            'products_listed': products_listed,
            'avg_reply_time_seconds': 0.0,
            'period_start': period_start,
            'period_end': period_end,
        })


class DailyAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        snapshots = DailyUsageSnapshot.objects.filter(client=profile).order_by('date')[:30]
        data = [
            {
                'date': s.date,
                'messages_sent': s.messages_sent,
                'conversations': s.conversations,
                'products_listed': s.products_listed,
            }
            for s in snapshots
        ]
        return Response({'results': data})
