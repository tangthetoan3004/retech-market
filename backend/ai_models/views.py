from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import extend_schema

from .serializers import ImageUploadSerializer, AIPredictPriceSerializer
from .services import DamageDetectionService, AIPricingService, ModelLoader

class PredictDamageView(APIView):
    """
    Nhận danh sách ảnh và trả về dự đoán mức độ hư hỏng tổng hợp từ CV Model.
    """
    @extend_schema(request=ImageUploadSerializer, responses=dict)
    def post(self, request):
        serializer = ImageUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        image_files = serializer.validated_data['images']
        try:
            result = DamageDetectionService.predict_multiple(image_files)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PredictPriceView(APIView):
    """
    Dự đoán giá thu mua bằng AI Model.
    """
    @extend_schema(request=AIPredictPriceSerializer, responses=dict)
    def post(self, request):
        serializer = AIPredictPriceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        data = serializer.validated_data
        predictions = data.pop('ai_damage_predictions', None)
        
        try:
            result = AIPricingService.predict_price(data, predictions)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AIHealthCheckView(APIView):
    """
    Kiểm tra trạng thái của các AI model (Mock hay Real).
    """
    def get(self, request):
        is_ready = ModelLoader.is_ai_ready()
        return Response({
            "status": "ok",
            "models_loaded": is_ready,
            "cv_model_status": "MOCK" if ModelLoader.get_cv_model() == "MOCK_CV_MODEL" else "LOADED",
            "price_model_status": "MOCK" if ModelLoader.get_price_model() == "MOCK_PRICE_MODEL" else "LOADED"
        })
