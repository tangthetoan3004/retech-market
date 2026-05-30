from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdmin(BasePermission):
    """
    Cho phép user có is_staff=True (admin thường).
    """
    message = "Yêu cầu quyền Admin."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_staff
        )


class IsSuperAdmin(BasePermission):
    """Cho phép chỉ superuser (toàn quyền hệ thống)."""
    message = "Yêu cầu quyền Super Admin."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.is_superuser
        )


class IsStaffOrSuperAdmin(BasePermission):
    """Cho phép is_staff HOẶC is_superuser — dùng cho trang quản trị chung."""
    message = "Yêu cầu quyền Staff hoặc Super Admin."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and (request.user.is_staff or request.user.is_superuser)
        )


class IsOwnerOrStaff(BasePermission):
    """
    Object-level permission: chủ sở hữu hoặc staff mới được phép.
    Dùng cho các endpoint như /api/users/<id>/ để admin xem user khác.
    """
    message = "Bạn không có quyền thực hiện thao tác này."

    def has_object_permission(self, request, view, obj):
        # Staff/superuser luôn được phép
        if request.user.is_staff or request.user.is_superuser:
            return True
        # Chủ sở hữu chỉ được đọc/sửa object của chính mình
        return obj == request.user