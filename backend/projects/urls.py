from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    GuideOverviewView,
    GuideTaskDetailView,
    GuideTaskListView,
    GuideTeamAnalysisView,
    GuideTeamsView,
    MilestoneViewSet,
    ProjectViewSet,
    StudentTaskListView,
    SubmissionViewSet,
    TaskSubmissionDetailView,
    TaskSubmissionListView,
)

router = DefaultRouter()
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"milestones", MilestoneViewSet, basename="milestone")
router.register(r"submissions", SubmissionViewSet, basename="submission")

urlpatterns = [
    path("", include(router.urls)),
    # Guide APIs
    path("guide/overview/", GuideOverviewView.as_view(), name="guide-overview"),
    path("guide/teams/", GuideTeamsView.as_view(), name="guide-teams"),
    path(
        "guide/teams/<int:team_id>/analysis/",
        GuideTeamAnalysisView.as_view(),
        name="guide-team-analysis",
    ),
    path("guide/tasks/", GuideTaskListView.as_view(), name="guide-tasks"),
    path(
        "guide/tasks/<int:pk>/", GuideTaskDetailView.as_view(), name="guide-task-detail"
    ),
    # Student task view
    path("student/tasks/", StudentTaskListView.as_view(), name="student-tasks"),
    # Task submissions (shared by student & guide)
    path(
        "task-submissions/",
        TaskSubmissionListView.as_view(),
        name="task-submission-list",
    ),
    path(
        "task-submissions/<int:pk>/",
        TaskSubmissionDetailView.as_view(),
        name="task-submission-detail",
    ),
]
