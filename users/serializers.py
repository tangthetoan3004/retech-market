from rest_framework import serializers
from django.contrib.auth import get_user_model
User = get_user_model()
class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'phone_number', 'first_name', 'last_name')
    def create(self, validated_data):
        user = User.objects.create_user(
            username = validated_data['username'],
            email = validated_data.get('email', ''),
            password = validated_data['password'],
            phone_number = validated_data.get('phone_number', ''),
            first_name = validated_data.get('first_name', ''),
            last_name = validated_data.get('last_name', '')
        )
        return user
    def validate_email(self, value):
        if not value or value.strip() == "":
            raise serializers.ValidationError("Email field cannot be empty.")
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already in use.")
        return value
    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters long.")
        return value
    def validate_phone_number(self, value):
        if value and not (value.isdigit() and value.startswith('0')):
            raise serializers.ValidationError("Phone number must contain only digits and start with 0.")
        return value
    
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Mật khẩu cũ không đúng")
        return value
    
    def validate(self, data):
        if data['old_password'] == data['new_password']:
            raise serializers.ValidationError("Mật khẩu mới phải khác mật khẩu cũ")
        if len(data['new_password']) < 8:
            raise serializers.ValidationError("Mật khẩu mới phải có ít nhất 8 ký tự")
        return data

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyOtpSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6, min_length=6)

    def validate_otp(self, value):
        if not value.isdigit():
            raise serializers.ValidationError("OTP phải là 6 chữ số.")
        return value


class ResetPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    reset_token = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Mật khẩu mới phải có ít nhất 8 ký tự.")
        return value


class GoogleLoginSerializer(serializers.Serializer):
    code = serializers.CharField(required=True)


class UserProfileSerializer(serializers.ModelSerializer):
    is_admin = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'username', 'email',
            'phone_number', 'first_name', 'last_name',
            'address', 'date_joined',
            'is_active', 'is_staff', 'is_superuser',  
            'is_admin',                                
        )
        read_only_fields = (
            'id', 'username', 'email', 'date_joined',
            'is_active', 'is_staff', 'is_superuser',  
        )

    def get_is_admin(self, obj) -> bool:
        """True nếu user có thể truy cập trang quản trị."""
        return obj.is_staff or obj.is_superuser
