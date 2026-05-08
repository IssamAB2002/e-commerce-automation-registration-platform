import logging
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from django.core.cache import cache
from .models import ActivityLog
from .serializers import ActivityLogSerializer

logger = logging.getLogger(__name__)


class ActivityLogListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ActivityLogSerializer

    def get_queryset(self):
        return ActivityLog.objects.filter(client=self.request.user.profile)


class ActivitySummaryView(APIView):
    """Return an AI-generated summary of the client's recent actions. Cached 10 min."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client = request.user.profile
        cache_key = f'activity_summary_{client.id}'
        cached = cache.get(cache_key)
        if cached:
            return Response({'summary': cached})

        logs = ActivityLog.objects.filter(client=client).order_by('-created_at')[:20]
        if not logs.exists():
            return Response({'summary': 'No recent activity yet.'})

        api_key = getattr(settings, 'GEMINI_API_KEY', None)
        if not api_key:
            return Response({'summary': 'AI summary not available.'})

        log_text = '\n'.join(
            f"- [{log.created_at.strftime('%Y-%m-%d %H:%M')}] {log.action_type}: {log.description}"
            for log in logs
        )
        prompt = (
            'Summarize the following recent activity log for an e-commerce store owner '
            'using EcomAuto (an AI Messenger automation platform). '
            'Write 2-3 plain sentences, friendly tone, no bullet points, no markdown.\n\n'
            f'{log_text}'
        )

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(prompt)
            summary = response.text.strip()
            cache.set(cache_key, summary, timeout=600)
            return Response({'summary': summary})
        except Exception as exc:
            logger.exception('Failed to generate activity summary: %s', exc)
            return Response({'summary': 'Could not generate summary at this time.'})
