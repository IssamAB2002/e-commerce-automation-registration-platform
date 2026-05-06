import os
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from shared.permissions import IsClientOwner
from apps.activity.models import ActivityLog
from .models import Product, ProductFile, ALLOWED_EXTENSIONS_BY_PLAN
from .serializers import ProductSerializer, ProductFileSerializer
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


class ProductFileListUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request, pk):
        try:
            product = Product.objects.get(pk=pk, client=request.user.profile)
        except Product.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        files = ProductFile.objects.filter(product=product)
        serializer = ProductFileSerializer(files, many=True, context={'request': request})

        # Compute total storage used by this client
        from django.db.models import Sum
        used_bytes = ProductFile.objects.filter(client=request.user.profile).aggregate(
            total=Sum('file_size')
        )['total'] or 0
        plan = request.user.profile.plan
        limit_bytes = plan.file_upload_limit if plan else 5 * 1024 * 1024

        return Response({
            'results': serializer.data,
            'storage': {
                'used_bytes': used_bytes,
                'limit_bytes': limit_bytes,
                'used_mb': round(used_bytes / (1024 * 1024), 2),
                'limit_mb': round(limit_bytes / (1024 * 1024), 2),
            },
        })

    def post(self, request, pk):
        try:
            product = Product.objects.get(pk=pk, client=request.user.profile)
        except Product.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'No file provided.'}, status=400)

        client = request.user.profile
        plan = client.plan
        plan_name = plan.name if plan else 'starter'

        # Validate file extension
        ext = os.path.splitext(uploaded_file.name)[1].lower()
        allowed = ALLOWED_EXTENSIONS_BY_PLAN.get(plan_name, ['.txt'])
        if ext not in allowed:
            return Response(
                {'error': f'File type "{ext}" not allowed on your plan. Allowed: {", ".join(allowed)}'},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Validate total storage limit
        from django.db.models import Sum
        used_bytes = ProductFile.objects.filter(client=client).aggregate(
            total=Sum('file_size')
        )['total'] or 0
        limit_bytes = plan.file_upload_limit if plan else 5 * 1024 * 1024
        if used_bytes + uploaded_file.size > limit_bytes:
            limit_mb = round(limit_bytes / (1024 * 1024), 1)
            return Response(
                {'error': f'Storage limit of {limit_mb} MB exceeded. Upgrade your plan to upload more files.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        product_file = ProductFile.objects.create(
            product=product,
            client=client,
            file=uploaded_file,
            original_name=uploaded_file.name,
            file_size=uploaded_file.size,
        )
        return Response(
            ProductFileSerializer(product_file, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )


class ProductFileDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, file_id):
        try:
            product_file = ProductFile.objects.get(
                id=file_id, product__pk=pk, client=request.user.profile
            )
        except ProductFile.DoesNotExist:
            return Response({'error': 'Not found.'}, status=404)

        # Remove the actual file from storage
        product_file.file.delete(save=False)
        product_file.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
