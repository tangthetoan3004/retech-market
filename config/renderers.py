from rest_framework.renderers import JSONRenderer

class CustomJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        response_data = {
            'status': 'success', 'code': 200, 'message': 'Success', 'data': None }
        response = renderer_context.get('response')
        if response and response.status_code >= 400:
            return super().render(data, accepted_media_type, renderer_context)
        if response:
            response_data['code'] = response.status_code
        
        if data is not None:
            if isinstance(data, dict) and 'results' in data:
                response_data['data'] = data['results']
                response_data['meta'] = {k: v for k,v in data.items() if k != 'results'}
            else:
                response_data['data'] = data
        return super().render(response_data, accepted_media_type, renderer_context)
            