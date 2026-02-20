from django.conf import settings
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import authenticate

from .serializers import (
    UserRegistrationSerializer,
    ChangePasswordSerializer,
    UserProfileSerializer,
)


# ─── Helper ──────────────────────────────────────────────────────────────────

def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    """Gắn access token và refresh token vào HttpOnly cookie của response."""
    common = dict(
        httponly=settings.COOKIE_HTTPONLY,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )
    response.set_cookie(
        key=settings.ACCESS_TOKEN_COOKIE,
        value=access_token,
        max_age=settings.ACCESS_TOKEN_COOKIE_MAX_AGE,
        **common,
    )
    response.set_cookie(
        key=settings.REFRESH_TOKEN_COOKIE,
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_COOKIE_MAX_AGE,
        **common,
    )


def _clear_auth_cookies(response: Response) -> None:
    """Xóa cả hai auth cookie (dùng khi logout)."""
    response.delete_cookie(settings.ACCESS_TOKEN_COOKIE)
    response.delete_cookie(settings.REFRESH_TOKEN_COOKIE)


# ─── Register ────────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "User registered successfully.", "user": serializer.data},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── Login ───────────────────────────────────────────────────────────────────

class LoginView(APIView):
    """
    Nhận username + password, xác thực, rồi set access_token & refresh_token
    vào HttpOnly cookie. Trả về thông tin user trong body (KHÔNG trả token).
    """
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"

    def post(self, request):
        username = request.data.get("username", "").strip()
        password = request.data.get("password", "")

        if not username or not password:
            return Response(
                {"error": "Username và password là bắt buộc."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = authenticate(request, username=username, password=password)
        if user is None:
            return Response(
                {"error": "Tên đăng nhập hoặc mật khẩu không đúng."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        # Tạo cặp token bằng simplejwt
        refresh = RefreshToken.for_user(user)
        access_token  = str(refresh.access_token)
        refresh_token = str(refresh)

        # Serialize user để trả về body
        user_data = UserProfileSerializer(user, context={"request": request}).data

        response = Response(
            {"message": "Đăng nhập thành công.", "user": user_data},
            status=status.HTTP_200_OK,
        )
        _set_auth_cookies(response, access_token, refresh_token)
        return response


# ─── Token Refresh ───────────────────────────────────────────────────────────

class CookieTokenRefreshView(APIView):
    """
    Đọc refresh_token từ HttpOnly cookie, cấp access_token mới (và refresh_token
    mới nếu ROTATE_REFRESH_TOKENS=True), set lại vào cookie.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token_str = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE)

        if not refresh_token_str:
            return Response(
                {"error": "Refresh token không tìm thấy."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            refresh = RefreshToken(refresh_token_str)
            new_access_token  = str(refresh.access_token)
            new_refresh_token = str(refresh)   # Sau khi rotate, đây là token mới

        except TokenError as e:
            return Response(
                {"error": "Refresh token không hợp lệ hoặc đã hết hạn."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        response = Response(
            {"message": "Token đã được làm mới."},
            status=status.HTTP_200_OK,
        )
        _set_auth_cookies(response, new_access_token, new_refresh_token)
        return response


# ─── Logout ──────────────────────────────────────────────────────────────────

class LogoutView(APIView):
    """
    Blacklist refresh_token đọc từ cookie, sau đó xóa cả hai cookie.
    Không cần IsAuthenticated vì cookie là bằng chứng duy nhất.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        refresh_token_str = request.COOKIES.get(settings.REFRESH_TOKEN_COOKIE)

        response = Response(
            {"message": "Đăng xuất thành công."},
            status=status.HTTP_205_RESET_CONTENT,
        )

        if refresh_token_str:
            try:
                token = RefreshToken(refresh_token_str)
                token.blacklist()
            except TokenError:
                # Token đã invalid/hết hạn → vẫn xóa cookie, không báo lỗi
                pass

        _clear_auth_cookies(response)
        return response


# ─── Change Password ──────────────────────────────────────────────────────────

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            user.set_password(serializer.validated_data["new_password"])
            user.save()
            # Sau khi đổi mật khẩu, force logout — xóa cookie
            response = Response(
                {"message": "Đổi mật khẩu thành công. Vui lòng đăng nhập lại."},
                status=status.HTTP_200_OK,
            )
            _clear_auth_cookies(response)
            return response
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ─── User Profile ─────────────────────────────────────────────────────────────

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user