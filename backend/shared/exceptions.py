from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        errors = response.data
        if isinstance(errors, dict):
            detail = errors.get('detail', errors)
        else:
            detail = errors

        response.data = {
            'success': False,
            'error': detail,
            'status_code': response.status_code,
        }
    else:
        logger.exception('Unhandled exception', exc_info=exc)
        response = Response(
            {'success': False, 'error': 'Internal server error', 'status_code': 500},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
