from django.urls import path
from .views import LoginView, UserListView, UserDetailView, TeamListView, TeamDetailView, UserInviteView, UserMeView

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('users/me/', UserMeView.as_view(), name='user-me'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/invite/', UserInviteView.as_view(), name='user-invite'),
    path('teams/', TeamListView.as_view(), name='team-list'),
    path('teams/<int:pk>/', TeamDetailView.as_view(), name='team-detail'),
]
