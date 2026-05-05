from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from shared.permissions import IsClientOwner
from apps.activity.models import ActivityLog
from .models import Product
from .serializers import ProductSerializer
from .tasks import generate_product_description


class ProductListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        qs = Product.objects.filter(client=request.user.profile)
        status_filter = request.query_params.get('status')
        category_filter = request.query_params.get('category')
        search = request.query_params.get('search')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if category_filter:
            qs = qs.filter(category=category_filter)
        if search:
            qs = qs.filter(name__icontains=search)
        serializer = ProductSerializer(qs, many=True, context={'request': request})
        return Response({'count': qs.count(), 'results': serializer.data})

    def post(self, request):
        serializer = ProductSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        product = serializer.save(client=request.user.profile)
        ActivityLog.objects.create(
            client=request.user.profile,
            action_type='product_added',
            description=f'Product "{product.name}" added.',
            metadata={'product_id': str(product.id)},
        )
        return Response(ProductSerializer(product, context={'request': request}).data,
                        status=status.HTTP_201_CREATED)


class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def _get_product(self, request, pk):
        try:
            return Product.objects.get(pk=pk, client=request.user.profile)
        except Product.DoesNotExist:
            return None

    def get(self, request, pk):
        product = self._get_product(request, pk)
        if not product:
            return Response({'error': 'Not found.'}, status=404)
        return Response(ProductSerializer(product, context={'request': request}).data)

    def patch(self, request, pk):
        product = self._get_product(request, pk)
        if not product:
            return Response({'error': 'Not found.'}, status=404)
        serializer = ProductSerializer(product, data=request.data, partial=True,
                                       context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        ActivityLog.objects.create(
            client=request.user.profile,
            action_type='product_updated',
            description=f'Product "{product.name}" updated.',
            metadata={'product_id': str(pk)},
        )
        return Response(serializer.data)

    def delete(self, request, pk):
        product = self._get_product(request, pk)
        if not product:
            return Response({'error': 'Not found.'}, status=404)
        name = product.name
        product.delete()
        ActivityLog.objects.create(
            client=request.user.profile,
            action_type='product_deleted',
            description=f'Product "{name}" deleted.',
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductStatusToggleView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        try:
            product = Product.objects.get(pk=pk, client=request.user.profile)
        except Product.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)
        product.status = 'draft' if product.status == 'active' else 'active'
        product.save(update_fields=['status'])
        return Response({'status': product.status})


class ProductGenerateDescriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            product = Product.objects.get(pk=pk, client=request.user.profile)
        except Product.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)
        task = generate_product_description.delay(str(product.id))
        return Response({'task_id': task.id, 'message': 'Description generation started.'},
                        status=status.HTTP_202_ACCEPTED)
