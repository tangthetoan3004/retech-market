from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError


class CookieJWTAuthentication(JWTAuthentication):
    """
    Đọc JWT theo thứ tự ưu tiên:
      1. HttpOnly Cookie 'access_token'  → dùng cho Frontend (React)
      2. Authorization: Bearer <token>   → dùng cho Postman / Swagger / mobile
    """

    def authenticate(self, request):
        # ── Ưu tiên 1: Cookie ──────────────────────────────────────────────────
        raw_token = request.COOKIES.get(settings.ACCESS_TOKEN_COOKIE)

        # ── Ưu tiên 2: Authorization header (fallback cho Postman/Swagger) ──────
        if raw_token is None:
            header = self.get_header(request)           # b"Bearer eyJ..."
            if header is not None:
                raw_token = self.get_raw_token(header)  # b"eyJ..."

        if raw_token is None:
            return None  

        try:
            validated_token = self.get_validated_token(raw_token)
        except TokenError as e:
            raise InvalidToken(e.args[0]) from e

        return self.get_user(validated_token), validated_token

