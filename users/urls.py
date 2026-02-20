from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    CookieTokenRefreshView,
    LogoutView,
    ChangePasswordView,
    UserProfileView,
)

urlpatterns = [
    path("register/",       RegisterView.as_view(),          name="register"),
    path("login/",          LoginView.as_view(),              name="login"),
    path("token/refresh/",  CookieTokenRefreshView.as_view(), name="token_refresh"),
    path("logout/",         LogoutView.as_view(),             name="logout"),
    path("change-password/",ChangePasswordView.as_view(),     name="change_password"),
    path("profile/",        UserProfileView.as_view(),        name="user_profile"),
]