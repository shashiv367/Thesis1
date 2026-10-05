from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    ROLE_CHOICES = (
        ('student', 'Student'),
        ('guide', 'Guide'),
        ('admin', 'Admin'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='student')
    
    def __str__(self):
        return f"{self.username} ({self.role})"

class Team(models.Model):
    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    guide = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='guided_teams', limit_choices_to={'role': 'guide'})
    students = models.ManyToManyField(User, related_name='teams', limit_choices_to={'role': 'student'})

    def __str__(self):
        return self.name
