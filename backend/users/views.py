from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated
from .models import User
from .serializers import UserSerializer

class LoginView(APIView):
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'role': user.role,
                'username': user.username
            })
        else:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

class UserListView(APIView):
    def get(self, request):
        users = User.objects.exclude(role='admin').order_by('-id')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        role = request.data.get('role')
        name = request.data.get('name', '')
        
        if not email or not password or not role:
            return Response({'error': 'Missing fields'}, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=status.HTTP_400_BAD_REQUEST)
            
        # For simplicity, username is email
        user = User.objects.create_user(username=email, email=email, password=password, role=role, first_name=name)
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

class UserDetailView(APIView):
    def put(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            # Update fields
            name = request.data.get('name')
            email = request.data.get('email')
            password = request.data.get('password')
            
            if name:
                user.first_name = name
            if email:
                user.email = email
                user.username = email
            if password:
                user.set_password(password)
                
            user.save()
            return Response(UserSerializer(user).data)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response(status=status.HTTP_404_NOT_FOUND)

class UserInviteView(APIView):
    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
            # This is a mock implementation of email sending
            # In a real environment, you'd use django.core.mail.send_mail
            email_configured = False # Set to true when SMTP is configured
            if not email_configured:
                return Response({
                    'message': f'Email integration not configured. In a real environment, an invite would be sent to {user.email}',
                    'status': 'mock_success'
                })
            else:
                return Response({'message': 'Invite sent successfully'})
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

class UserMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if old_password and new_password:
            if not user.check_password(old_password):
                return Response({'error': 'Incorrect current password'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password updated successfully'})
        return Response({'error': 'Invalid request'}, status=status.HTTP_400_BAD_REQUEST)

from .models import Team
from .serializers import TeamSerializer
from rest_framework import generics

class TeamListView(generics.ListCreateAPIView):
    queryset = Team.objects.all().order_by('-id')
    serializer_class = TeamSerializer

class TeamDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Team.objects.all()
    serializer_class = TeamSerializer
