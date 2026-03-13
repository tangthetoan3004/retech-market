import random
import uuid
import logging

import requests as http_requests

from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.contrib.auth import authenticate
from .permissions import IsStaffOrSuperAdmin

from .serializers import (
    UserRegistrationSerializer,
    ChangePasswordSerializer,
    UserProfileSerializer,
    ForgotPasswordSerializer,
    VerifyOtpSerializer,
    ResetPasswordSerializer,
    GoogleLoginSerializer,
)

logger = logging.getLogger(__name__)


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
    authentication_classes = []
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
    authentication_classes = []
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

        if not user.is_active:
            return Response(
                {"error": "Tài khoản đã bị vô hiệu hóa."},
                status=status.HTTP_403_FORBIDDEN,
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
    authentication_classes = []
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


    """
    API quản lý user dành cho Admin/Staff.
    GET  /api/users/manage/        → Danh sách tất cả user
    POST /api/users/manage/<id>/toggle-active/ → Kích hoạt / Vô hiệu hóa user
    """

class UserManageView(APIView):
    permission_classes = [IsAuthenticated, IsStaffOrSuperAdmin]

    def get(self, request):
        from .models import User as UserModel
        from .serializers import UserProfileSerializer
        users = UserModel.objects.all().order_by('-date_joined')
        serializer = UserProfileSerializer(users, many=True, context={'request': request})
        return Response(serializer.data)


class UserManageToggleActiveView(APIView):
    permission_classes = [IsAuthenticated, IsStaffOrSuperAdmin] 
    def post(self, request, user_id: int):
        """Toggle is_active của user. Chỉ superuser mới được vô hiệu hóa user khác."""
        from .models import User as UserModel
        if not request.user.is_superuser:
            return Response(
                {"error": "Chỉ Super Admin mới có quyền thay đổi trạng thái user."},
                status=status.HTTP_403_FORBIDDEN,
            )
        try:
            target_user = UserModel.objects.get(id=user_id)
        except UserModel.DoesNotExist:
            return Response({"error": "User không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

        if target_user == request.user:
            return Response(
                {"error": "Không thể tự vô hiệu hóa tài khoản của chính mình."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user.is_active = not target_user.is_active
        target_user.save(update_fields=['is_active'])

        action = "kích hoạt" if target_user.is_active else "vô hiệu hóa"
        return Response(
            {"message": f"Đã {action} tài khoản {target_user.username}.", "is_active": target_user.is_active},
            status=status.HTTP_200_OK,
        )


# ─── OTP Email Helper ─────────────────────────────────────────────────────────

def _build_otp_email_html(otp: int) -> str:
    return f"""<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{ margin:0; padding:0; background:#f3f4f6; font-family: Arial, sans-serif; }}
    .wrapper {{ max-width:560px; margin:40px auto; background:#ffffff; border-radius:12px;
                overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,.08); }}
    .header {{ background:#111827; padding:28px 36px; }}
    .header h1 {{ margin:0; color:#ffffff; font-size:20px; letter-spacing:.5px; }}
    .header span {{ color:#6b7280; font-size:13px; }}
    .body {{ padding:36px; }}
    .body h2 {{ margin-top:0; font-size:18px; color:#111827; }}
    .body p {{ color:#4b5563; font-size:14px; line-height:1.6; }}
    .otp-card {{ background:#eff6ff; border:2px solid #3b82f6; border-radius:10px;
                 text-align:center; padding:24px 16px; margin:24px 0; }}
    .otp-code {{ font-size:42px; font-weight:700; letter-spacing:12px; color:#1d4ed8;
                 font-family:monospace; }}
    .note {{ background:#fef9c3; border-left:4px solid #f59e0b; padding:12px 16px;
             border-radius:4px; font-size:13px; color:#78350f; margin-top:20px; }}
    .footer {{ background:#f9fafb; padding:16px 36px; text-align:center;
               font-size:12px; color:#9ca3af; border-top:1px solid #e5e7eb; }}
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>ReTech Market</h1>
      <span>Hệ thống mua bán thiết bị công nghệ đã qua sử dụng</span>
    </div>
    <div class="body">
      <h2>Đặt lại mật khẩu</h2>
      <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản liên kết
         với địa chỉ email này. Vui lòng sử dụng mã OTP bên dưới:</p>
      <div class="otp-card">
        <div class="otp-code">{otp}</div>
      </div>
      <div class="note">
        Mã OTP có hiệu lực trong <strong>5 phút</strong>.
        Không chia sẻ mã này với bất kỳ ai, kể cả nhân viên ReTech Market.
      </div>
      <p style="margin-top:20px">
        Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        Tài khoản của bạn vẫn an toàn.
      </p>
    </div>
    <div class="footer">
      &copy; 2026 ReTech Market &nbsp;·&nbsp; Mọi quyền được bảo lưu.
    </div>
  </div>
</body>
</html>"""


def _send_otp_email(email: str, otp: int) -> None:
    subject = "Mã OTP đặt lại mật khẩu - ReTech Market"
    plain_message = f"Mã OTP của bạn là: {otp}. Mã có hiệu lực trong 5 phút."
    send_mail(
        subject=subject,
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        html_message=_build_otp_email_html(otp),
        fail_silently=False,
    )


def _process_send_otp(email: str):
    """
    Kiểm tra rate limit và gửi OTP nếu email tồn tại trong DB.
    Trả về Response lỗi nếu vượt rate limit, ngược lại trả None.
    """
    otp_count_key = f"otp_count:{email}"
    otp_count = cache.get(otp_count_key) or 0

    if otp_count >= 3:
        return Response(
            {"error": "Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút."},
            status=status.HTTP_429_TOO_MANY_REQUESTS,
        )

    from .models import User as UserModel
    user = UserModel.objects.filter(email=email).first()
    if user:
        otp = random.randint(100000, 999999)
        cache.set(f"otp:{email}", str(otp), timeout=300)
        cache.set(f"otp_attempts:{email}", 0, timeout=300)
        if otp_count == 0:
            cache.set(otp_count_key, 1, timeout=900)
        else:
            try:
                cache.incr(otp_count_key)
            except ValueError:
                cache.set(otp_count_key, 1, timeout=900)
        try:
            _send_otp_email(email, otp)
        except Exception as exc:
            logger.error("Gửi OTP email thất bại cho %s: %s", email, exc, exc_info=True)

    return None  # Không có lỗi → tiếp tục trả 200


# ─── Forgot Password ──────────────────────────────────────────────────────────

class ForgotPasswordView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        error_response = _process_send_otp(email)
        if error_response is not None:
            return error_response

        return Response(
            {"message": "Nếu email tồn tại, hệ thống sẽ gửi mã OTP."},
            status=status.HTTP_200_OK,
        )


# ─── Resend OTP ───────────────────────────────────────────────────────────────

class ResendOtpView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        error_response = _process_send_otp(email)
        if error_response is not None:
            return error_response

        return Response(
            {"message": "Nếu email tồn tại, hệ thống sẽ gửi mã OTP."},
            status=status.HTTP_200_OK,
        )


# ─── Verify OTP ───────────────────────────────────────────────────────────────

class VerifyOtpView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VerifyOtpSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        otp_input = serializer.validated_data["otp"]

        attempts_key = f"otp_attempts:{email}"
        attempts = cache.get(attempts_key) or 0

        if attempts >= 5:
            cache.delete(f"otp:{email}")
            return Response(
                {"error": "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng yêu cầu mã mới sau 15 phút."},
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        cached_otp = cache.get(f"otp:{email}")
        if cached_otp is None:
            return Response(
                {"error": "OTP đã hết hạn. Vui lòng yêu cầu mã mới."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if str(cached_otp) != str(otp_input):
            new_attempts = attempts + 1
            if attempts == 0:
                cache.set(attempts_key, new_attempts, timeout=300)
            else:
                try:
                    cache.incr(attempts_key)
                except ValueError:
                    cache.set(attempts_key, new_attempts, timeout=300)
            remaining = 5 - new_attempts
            return Response(
                {"error": f"OTP không đúng. Bạn còn {remaining} lần thử."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # OTP khớp — xóa cache OTP + attempts, tạo reset_token
        cache.delete(f"otp:{email}")
        cache.delete(attempts_key)

        reset_token = str(uuid.uuid4())
        cache.set(f"reset:{email}", reset_token, timeout=600)

        return Response(
            {
                "message": "OTP hợp lệ. Bạn có thể đặt lại mật khẩu.",
                "reset_token": reset_token,
            },
            status=status.HTTP_200_OK,
        )


# ─── Reset Password ───────────────────────────────────────────────────────────

class ResetPasswordView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data["email"]
        reset_token = serializer.validated_data["reset_token"]
        new_password = serializer.validated_data["new_password"]

        cached_token = cache.get(f"reset:{email}")
        if cached_token is None or cached_token != reset_token:
            return Response(
                {"error": "Token không hợp lệ hoặc đã hết hạn. Vui lòng thực hiện lại từ đầu."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .models import User as UserModel
        user = UserModel.objects.filter(email=email).first()
        if not user:
            return Response(
                {"error": "Email không tồn tại trong hệ thống."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.check_password(new_password):
            return Response(
                {"error": "Mật khẩu mới phải khác mật khẩu hiện tại."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.set_password(new_password)
        user.save(update_fields=["password"])
        cache.delete(f"reset:{email}")

        return Response(
            {"message": "Đổi mật khẩu thành công. Vui lòng đăng nhập lại."},
            status=status.HTTP_200_OK,
        )


# ─── Google OAuth Login ──────────────────────────────────────────────────────

class GoogleLoginView(APIView):
    """
    POST /api/users/google/login/
    Nhận authorization_code từ Google, đổi lấy id_token,
    xác minh danh tính, tạo/cập nhật user, trả JWT qua HttpOnly Cookie.
    """
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GoogleLoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        code = serializer.validated_data["code"]
        if not code:
            return Response(
                {"error": "Authorization code là bắt buộc."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Step 1: Exchange authorization code for tokens ---
        token_url = "https://oauth2.googleapis.com/token"
        token_payload = {
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        try:
            token_resp = http_requests.post(token_url, data=token_payload, timeout=10)
        except http_requests.RequestException:
            return Response(
                {"error": "Không thể kết nối đến Google. Vui lòng thử lại."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if token_resp.status_code != 200:
            logger.warning("Google token exchange failed: %s", token_resp.text)
            return Response(
                {"error": "Mã xác thực Google không hợp lệ hoặc đã hết hạn."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        token_data = token_resp.json()
        access_token_google = token_data.get("access_token")
        if not access_token_google:
            return Response(
                {"error": "Google không trả về access_token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Step 2: Get user info from Google ---
        try:
            userinfo_resp = http_requests.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token_google}"},
                timeout=10,
            )
        except http_requests.RequestException:
            return Response(
                {"error": "Không thể lấy thông tin từ Google. Vui lòng thử lại."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        if userinfo_resp.status_code != 200:
            return Response(
                {"error": "Không thể xác minh tài khoản Google."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        id_info = userinfo_resp.json()

        # --- Step 3: Extract user info ---
        google_sub = id_info.get("sub")
        email = id_info.get("email")
        given_name = id_info.get("given_name", "")
        family_name = id_info.get("family_name", "")

        if not email or not google_sub:
            return Response(
                {"error": "Không thể lấy thông tin từ tài khoản Google."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # --- Step 4: Find or create user ---
        from .models import User as UserModel

        user = UserModel.objects.filter(
            Q(email=email) | Q(google_id=google_sub)
        ).first()

        if user is None:
            # Create new user with unusable password
            # Use email prefix as username, ensure uniqueness
            base_username = email.split("@")[0]
            username = base_username
            counter = 1
            while UserModel.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            user = UserModel(
                username=username,
                email=email,
                first_name=given_name,
                last_name=family_name,
                google_id=google_sub,
            )
            user.set_unusable_password()
            user.save()
        else:
            # Update google_id if not yet linked
            if not user.google_id:
                user.google_id = google_sub
                user.save(update_fields=["google_id"])

        # --- Step 5: Check active status ---
        if not user.is_active:
            return Response(
                {"error": "Tài khoản đã bị vô hiệu hóa."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # --- Step 6: Issue JWT via HttpOnly cookies ---
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        user_data = UserProfileSerializer(user, context={"request": request}).data

        response = Response(
            {"message": "Đăng nhập Google thành công.", "user": user_data},
            status=status.HTTP_200_OK,
        )
        _set_auth_cookies(response, access_token, refresh_token)
        return response