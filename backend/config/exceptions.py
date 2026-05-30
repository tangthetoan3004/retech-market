from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        custom_response_data = {
            'status': 'error',
            'code': response.status_code,
            'message': 'Đã có lỗi xảy ra',
            'errors': response.data
        }
    
        if isinstance(response.data, dict):
            if 'detail' in response.data:
                custom_response_data['message'] = response.data['detail']
                del custom_response_data['errors']['detail']
        
            for k, v in response.data.items():
                if k != 'detail' and isinstance(v, list):
                    custom_response_data['message'] = f"{k}: {v[0]}"
        
        response.data = custom_response_data
    return response
    