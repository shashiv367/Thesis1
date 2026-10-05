from rest_framework import serializers
from .models import Project, Milestone, Submission, Task, TaskAssignment, TaskSubmission
from django.contrib.auth import get_user_model

User = get_user_model()

class SimpleUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'email', 'role']

class SubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)

    class Meta:
        model = Submission
        fields = '__all__'

class MilestoneSerializer(serializers.ModelSerializer):
    submissions = SubmissionSerializer(many=True, read_only=True)
    class Meta:
        model = Milestone
        fields = '__all__'

class ProjectSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, read_only=True)
    class Meta:
        model = Project
        fields = '__all__'

class TaskAssignmentSerializer(serializers.ModelSerializer):
    team_name = serializers.CharField(source='team.name', read_only=True)
    class Meta:
        model = TaskAssignment
        fields = ['id', 'team', 'team_name']

class TaskSerializer(serializers.ModelSerializer):
    assignments = TaskAssignmentSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.first_name', read_only=True)
    team_ids = serializers.ListField(child=serializers.IntegerField(), write_only=True, required=False)

    class Meta:
        model = Task
        fields = ['id', 'title', 'description', 'instructions', 'created_by', 'created_by_name',
                  'deadline', 'assignment_type', 'created_at', 'assignments', 'team_ids']
        read_only_fields = ['created_by', 'created_at']

    def create(self, validated_data):
        team_ids = validated_data.pop('team_ids', [])
        task = Task.objects.create(**validated_data)
        for tid in team_ids:
            TaskAssignment.objects.get_or_create(task=task, team_id=tid)
        return task

class TaskSubmissionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    task_title = serializers.CharField(source='task.title', read_only=True)
    evaluated_by_name = serializers.CharField(source='evaluated_by.first_name', read_only=True)

    class Meta:
        model = TaskSubmission
        fields = '__all__'
        read_only_fields = ['student', 'submitted_at']
