from django.db.models import Count, Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from .models import Order
from .serializers import OrderSerializer


class OrderListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Order.objects.filter(client=request.user.profile)
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        serializer = OrderSerializer(qs, many=True)
        return Response({'count': qs.count(), 'results': serializer.data})

    def post(self, request):
        serializer = OrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(client=request.user.profile)
        from apps.crm.tasks import notify_client_new_order
        notify_client_new_order.delay(str(order.id))
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            order = Order.objects.get(pk=pk, client=request.user.profile)
        except Order.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        new_status = request.data.get('status')
        if new_status not in dict(Order.STATUS_CHOICES):
            return Response({'error': 'Invalid status.'}, status=400)

        order.status = new_status
        order.save(update_fields=['status', 'updated_at'])

        from apps.activity.models import ActivityLog
        ActivityLog.objects.create(
            client=request.user.profile,
            action_type='order_updated',
            description=f'Order from {order.customer_name} marked as {new_status}.',
            metadata={'order_id': str(pk), 'status': new_status},
        )
        return Response(OrderSerializer(order).data)


class OrderStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        client = request.user.profile
        stats = Order.objects.filter(client=client).aggregate(
            total=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            confirmed=Count('id', filter=Q(status='confirmed')),
            delivered=Count('id', filter=Q(status='delivered')),
            cancelled=Count('id', filter=Q(status='cancelled')),
        )
        return Response(stats)


class InternalCreateOrderView(APIView):
    """Called by n8n when the AI has collected all order details. Secured by X-Internal-Key."""
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        secret = getattr(settings, 'INTERNAL_API_SECRET', None)
        if not secret or request.headers.get('X-Internal-Key') != secret:
            return Response({'error': 'Unauthorized.'}, status=status.HTTP_401_UNAUTHORIZED)

        from apps.accounts.models import ClientProfile
        client_id = request.data.get('client_id')
        try:
            client = ClientProfile.objects.get(user__id=client_id)
        except ClientProfile.DoesNotExist:
            return Response({'error': 'Client not found.'}, status=404)

        serializer = OrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save(client=client)

        from apps.crm.tasks import notify_client_new_order
        notify_client_new_order.delay(str(order.id))

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
