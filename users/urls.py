from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    CookieTokenRefreshView,
    LogoutView,
    ChangePasswordView,
    UserProfileView,
    UserManageView,
    UserManageToggleActiveView,
    ForgotPasswordView,
    VerifyOtpView,
    ResetPasswordView,
    ResendOtpView,
    GoogleLoginView,
)

urlpatterns = [
    path("register/",       RegisterView.as_view(),          name="register"),
    path("login/",          LoginView.as_view(),              name="login"),
    path("token/refresh/",  CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("logout/",         LogoutView.as_view(),             name="logout"),
    path("change-password/",ChangePasswordView.as_view(),     name="change_password"),
    path("profile/",        UserProfileView.as_view(),        name="user_profile"),
    path("manage/",           UserManageView.as_view(),           name="user_manage"),
    path("manage/<int:user_id>/toggle-active/",
         UserManageToggleActiveView.as_view(),
         name="user_manage_toggle_active"),
    # ── Forgot / OTP / Reset password ──────────────────────────────────────────
    path("password/forgot/",      ForgotPasswordView.as_view(), name="password_forgot"),
    path("password/verify-otp/",  VerifyOtpView.as_view(),      name="password_verify_otp"),
    path("password/reset/",       ResetPasswordView.as_view(),  name="password_reset"),
    path("password/resend-otp/",  ResendOtpView.as_view(),      name="password_resend_otp"),
    # ── Google OAuth ──────────────────────────────────────────────────────────
    path("google/login/",         GoogleLoginView.as_view(),    name="google_login"),
]
