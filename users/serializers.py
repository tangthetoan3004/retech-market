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