from rest_framework import serializers

from .models import Team, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "email", "role", "is_active"]


class TeamSerializer(serializers.ModelSerializer):
    guide = UserSerializer(read_only=True)
    guide_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.filter(role="guide"),
        source="guide",
        write_only=True,
        required=False,
        allow_null=True,
    )
    students = UserSerializer(many=True, read_only=True)
    student_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=User.objects.filter(role="student"),
        source="students",
        write_only=True,
        required=False,
    )

    class Meta:
        model = Team
        fields = [
            "id",
            "name",
            "description",
            "guide",
            "guide_id",
            "students",
            "student_ids",
        ]
