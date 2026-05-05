from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Conversation
from .serializers import ConversationSerializer, ConversationDetailSerializer


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Conversation.objects.filter(client=request.user.profile).select_related('facebook_page')
        sentiment = request.query_params.get('sentiment')
        if sentiment:
            qs = qs.filter(sentiment=sentiment)
        serializer = ConversationSerializer(qs, many=True)
        return Response({'count': qs.count(), 'results': serializer.data})


class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            convo = Conversation.objects.prefetch_related('messages').get(
                pk=pk, client=request.user.profile
            )
        except Conversation.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)
        serializer = ConversationDetailSerializer(convo)
        return Response(serializer.data)


class ConversationStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        qs = Conversation.objects.filter(client=profile)
        total = qs.count()
        positive = qs.filter(sentiment='positive').count()
        neutral = qs.filter(sentiment='neutral').count()
        negative = qs.filter(sentiment='negative').count()
        return Response({
            'total': total,
            'positive': positive,
            'neutral': neutral,
            'negative': negative,
        })
