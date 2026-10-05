from django.db import models
from django.conf import settings
from django.core.validators import FileExtensionValidator

class Project(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    student = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='student_projects', on_delete=models.CASCADE)
    guide = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='guide_projects', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class Milestone(models.Model):
    project = models.ForeignKey(Project, related_name='milestones', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    deadline = models.DateTimeField()
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.project.title} - {self.title}"

class Submission(models.Model):
    PLAGIARISM_STATUS_CHOICES = [
        ('not_checked', 'Not Checked'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    milestone = models.ForeignKey(Milestone, related_name='submissions', on_delete=models.CASCADE)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    file = models.FileField(upload_to='submissions/', validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])])
    submitted_at = models.DateTimeField(auto_now_add=True)
    plagiarism_score = models.FloatField(null=True, blank=True)
    plagiarism_status = models.CharField(max_length=20, choices=PLAGIARISM_STATUS_CHOICES, default='not_checked')
    plagiarism_matches = models.JSONField(null=True, blank=True)
    feedback = models.TextField(blank=True)
    score = models.FloatField(null=True, blank=True)
    grade = models.CharField(max_length=5, blank=True)
    evaluated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='evaluations_given', on_delete=models.SET_NULL, null=True, blank=True)
    evaluated_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Submission for {self.milestone.title}"

# New models for Guide Dashboard
class Task(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('due_soon', 'Due Soon'),
        ('overdue', 'Overdue'),
        ('completed', 'Completed'),
    ]
    ASSIGNMENT_TYPE_CHOICES = [
        ('specific', 'Specific Team'),
        ('global', 'Global'),
    ]
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    instructions = models.TextField(blank=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='created_tasks', on_delete=models.CASCADE)
    deadline = models.DateTimeField()
    assignment_type = models.CharField(max_length=10, choices=ASSIGNMENT_TYPE_CHOICES, default='specific')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class TaskAssignment(models.Model):
    task = models.ForeignKey(Task, related_name='assignments', on_delete=models.CASCADE)
    team = models.ForeignKey('users.Team', related_name='task_assignments', on_delete=models.CASCADE)

    class Meta:
        unique_together = ('task', 'team')

    def __str__(self):
        return f"{self.task.title} → {self.team.name}"

class TaskSubmission(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('under_review', 'Under Review'),
        ('evaluated', 'Evaluated'),
    ]
    task = models.ForeignKey(Task, related_name='task_submissions', on_delete=models.CASCADE)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='task_submissions', on_delete=models.CASCADE)
    file = models.FileField(upload_to='task_submissions/', validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])])
    comments = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    plagiarism_score = models.FloatField(null=True, blank=True)
    plagiarism_status = models.CharField(max_length=20, default='not_checked')
    plagiarism_matches = models.JSONField(null=True, blank=True)
    score = models.FloatField(null=True, blank=True)
    grade = models.CharField(max_length=5, blank=True)
    feedback = models.TextField(blank=True)
    evaluated_by = models.ForeignKey(settings.AUTH_USER_MODEL, related_name='task_evaluations_given', on_delete=models.SET_NULL, null=True, blank=True)
    evaluated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('task', 'student')

    def __str__(self):
        return f"{self.student.username} → {self.task.title}"
