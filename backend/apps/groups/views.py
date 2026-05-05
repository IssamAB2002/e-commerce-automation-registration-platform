from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from shared.permissions import IsAdminUser
from .models import Group
from .serializers import GroupSerializer


class GroupListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        groups = Group.objects.all()
        serializer = GroupSerializer(groups, many=True)
        return Response({'results': serializer.data})

    def post(self, request):
        serializer = GroupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GroupDetailView(APIView):
    permission_classes = [IsAdminUser]

    def _get_group(self, pk):
        try:
            return Group.objects.get(pk=pk)
        except Group.DoesNotExist:
            return None

    def get(self, request, pk):
        group = self._get_group(pk)
        if not group:
            return Response({'error': 'Not found.'}, status=404)
        serializer = GroupSerializer(group)
        return Response(serializer.data)

    def patch(self, request, pk):
        group = self._get_group(pk)
        if not group:
            return Response({'error': 'Not found.'}, status=404)
        serializer = GroupSerializer(group, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class GroupClientsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request, pk):
        group = Group.objects.filter(pk=pk).first()
        if not group:
            return Response({'error': 'Not found.'}, status=404)
        from apps.accounts.serializers import ClientProfileDetailSerializer
        clients = group.clients.select_related('user', 'plan').filter(is_active=True)
        serializer = ClientProfileDetailSerializer(clients, many=True)
        return Response({'results': serializer.data})
