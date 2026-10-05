from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.utils import timezone
from django.db.models import Avg
from .models import Project, Milestone, Submission, Task, TaskAssignment, TaskSubmission
from .serializers import (
    ProjectSerializer, MilestoneSerializer, SubmissionSerializer,
    TaskSerializer, TaskSubmissionSerializer
)
from users.models import Team


# ─── Shared permission helper ─────────────────────────────────────────────────

def is_guide_of_team(guide, team_id):
    return Team.objects.filter(id=team_id, guide=guide).exists()


# ─── Existing ViewSets (student-scoped) ───────────────────────────────────────

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Project.objects.filter(student=user)
        elif user.role == 'guide':
            return Project.objects.filter(guide=user)
        return Project.objects.all()


class MilestoneViewSet(viewsets.ModelViewSet):
    serializer_class = MilestoneSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Milestone.objects.filter(project__student=user)
        elif user.role == 'guide':
            return Milestone.objects.filter(project__guide=user)
        return Milestone.objects.all()


class SubmissionViewSet(viewsets.ModelViewSet):
    serializer_class = SubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return Submission.objects.filter(student=user)
        elif user.role == 'guide':
            return Submission.objects.filter(milestone__project__guide=user)
        return Submission.objects.all()

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)


# ─── Guide: Teams ─────────────────────────────────────────────────────────────

class GuideTeamsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'guide':
            return Response({'error': 'Forbidden'}, status=403)
        teams = Team.objects.filter(guide=request.user).prefetch_related('students')
        data = []
        for team in teams:
            students = team.students.all()
            # count tasks assigned to this team
            task_count = TaskAssignment.objects.filter(team=team).count()
            # count submissions for this team's students
            subs = TaskSubmission.objects.filter(
                task__assignments__team=team
            )
            pending_subs = subs.filter(status='submitted').count()
            scored_subs = subs.filter(score__isnull=False)
            avg_score = scored_subs.aggregate(a=Avg('score'))['a']
            data.append({
                'id': team.id,
                'name': team.name,
                'description': team.description or '',
                'student_count': students.count(),
                'task_count': task_count,
                'pending_submissions': pending_subs,
                'avg_score': round(avg_score, 1) if avg_score is not None else None,
                'students': [
                    {'id': s.id, 'name': s.first_name or s.email, 'email': s.email}
                    for s in students
                ]
            })
        return Response(data)


# ─── Guide: Tasks ─────────────────────────────────────────────────────────────

class GuideTaskListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'guide':
            return Response({'error': 'Forbidden'}, status=403)
        tasks = Task.objects.filter(created_by=request.user).prefetch_related('assignments__team')
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data)

    def post(self, request):
        if request.user.role != 'guide':
            return Response({'error': 'Forbidden'}, status=403)

        data = request.data.copy()
        assignment_type = data.get('assignment_type', 'specific')
        team_ids = data.get('team_ids', [])

        if isinstance(team_ids, str):
            import json
            try:
                team_ids = json.loads(team_ids)
            except Exception:
                team_ids = []

        # For global, auto-assign to ALL guide's teams
        if assignment_type == 'global':
            team_ids = list(Team.objects.filter(guide=request.user).values_list('id', flat=True))

        # Verify guide owns all specified teams
        for tid in team_ids:
            if not is_guide_of_team(request.user, tid):
                return Response({'error': f'You are not the guide of team {tid}'}, status=403)

        serializer = TaskSerializer(data={**data, 'team_ids': team_ids})
        if serializer.is_valid():
            serializer.save(created_by=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class GuideTaskDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if request.user.role != 'guide':
            return Response({'error': 'Forbidden'}, status=403)
        try:
            task = Task.objects.get(pk=pk, created_by=request.user)
        except Task.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)
        return Response(TaskSerializer(task).data)

    def delete(self, request, pk):
        if request.user.role != 'guide':
            return Response({'error': 'Forbidden'}, status=403)
        try:
            task = Task.objects.get(pk=pk, created_by=request.user)
            task.delete()
            return Response(status=204)
        except Task.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)


# ─── Student: Tasks visible to them ───────────────────────────────────────────

class StudentTaskListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'student':
            return Response({'error': 'Forbidden'}, status=403)
        student_teams = request.user.teams.all()
        tasks = Task.objects.filter(assignments__team__in=student_teams).distinct()
        return Response(TaskSerializer(tasks, many=True).data)


# ─── Task Submissions ──────────────────────────────────────────────────────────

class TaskSubmissionListView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        user = request.user
        if user.role == 'student':
            subs = TaskSubmission.objects.filter(student=user)
        elif user.role == 'guide':
            guide_teams = Team.objects.filter(guide=user)
            subs = TaskSubmission.objects.filter(
                task__assignments__team__in=guide_teams
            ).distinct()
        else:
            subs = TaskSubmission.objects.all()
        return Response(TaskSubmissionSerializer(subs, many=True).data)

    def post(self, request):
        if request.user.role != 'student':
            return Response({'error': 'Only students can submit'}, status=403)
        task_id = request.data.get('task')
        if not task_id:
            return Response({'error': 'task is required'}, status=400)
        # Verify student is assigned this task via their team
        student_teams = request.user.teams.all()
        if not Task.objects.filter(id=task_id, assignments__team__in=student_teams).exists():
            return Response({'error': 'Task not assigned to you'}, status=403)
        # Check if already submitted
        if TaskSubmission.objects.filter(task_id=task_id, student=request.user).exists():
            return Response({'error': 'Already submitted'}, status=400)
        serializer = TaskSubmissionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(student=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class TaskSubmissionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            sub = TaskSubmission.objects.get(pk=pk)
        except TaskSubmission.DoesNotExist:
            return None, Response({'error': 'Not found'}, status=404)
        if user.role == 'guide':
            guide_teams = Team.objects.filter(guide=user)
            if not sub.task.assignments.filter(team__in=guide_teams).exists():
                return None, Response({'error': 'Forbidden'}, status=403)
        elif user.role == 'student':
            if sub.student != user:
                return None, Response({'error': 'Forbidden'}, status=403)
        return sub, None

    def get(self, request, pk):
        sub, err = self.get_object(pk, request.user)
        if err:
            return err
        return Response(TaskSubmissionSerializer(sub).data)

    def patch(self, request, pk):
        """Guide uses this to evaluate (score/feedback) or trigger plagiarism"""
        if request.user.role != 'guide':
            return Response({'error': 'Forbidden'}, status=403)
        sub, err = self.get_object(pk, request.user)
        if err:
            return err

        action = request.data.get('action')

        if action == 'evaluate':
            score = request.data.get('score')
            feedback = request.data.get('feedback', '')
            if score is None:
                return Response({'error': 'score is required'}, status=400)
            score = float(score)
            # Calculate grade
            if score >= 90:
                grade = 'A'
            elif score >= 80:
                grade = 'B'
            elif score >= 70:
                grade = 'C'
            elif score >= 60:
                grade = 'D'
            else:
                grade = 'F'
            sub.score = score
            sub.grade = grade
            sub.feedback = feedback
            sub.status = 'evaluated'
            sub.evaluated_by = request.user
            sub.evaluated_at = timezone.now()
            sub.save()
            return Response(TaskSubmissionSerializer(sub).data)

        elif action == 'plagiarism':
            # Run synchronous plagiarism check (Celery not required)
            sub.plagiarism_status = 'processing'
            sub.save()
            try:
                import os
                file_path = sub.file.path
                ext = os.path.splitext(file_path)[1].lower()

                content = ''
                if ext == '.pdf':
                    try:
                        import PyPDF2
                        with open(file_path, 'rb') as f:
                            reader = PyPDF2.PdfReader(f)
                            for page in reader.pages:
                                content += page.extract_text() or ''
                    except Exception:
                        content = ''
                elif ext in ['.doc', '.docx']:
                    try:
                        import docx
                        doc = docx.Document(file_path)
                        content = ' '.join([p.text for p in doc.paragraphs])
                    except Exception:
                        content = ''

                if not content.strip():
                    sub.plagiarism_status = 'failed'
                    sub.save()
                    return Response({'error': 'Could not extract text from document. Install PyPDF2/python-docx.'}, status=400)

                from plagiarism_engine.analyzer import PlagiarismAnalyzer
                analyzer = PlagiarismAnalyzer()
                # Index current doc so future submissions compare against it
                analyzer.index_document(f"sub_{sub.id}", content)
                score_val, matches = analyzer.check_plagiarism(content)

                sub.plagiarism_score = score_val
                sub.plagiarism_matches = matches
                sub.plagiarism_status = 'completed'
                sub.save()
                return Response({
                    'plagiarism_score': score_val,
                    'plagiarism_status': 'completed',
                    'matches_count': len(matches),
                })
            except Exception as e:
                sub.plagiarism_status = 'failed'
                sub.save()
                return Response({'error': str(e)}, status=500)

        return Response({'error': 'Unknown action'}, status=400)


# ─── Guide: Overview Stats ────────────────────────────────────────────────────

class GuideOverviewView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'guide':
            return Response({'error': 'Forbidden'}, status=403)
        guide = request.user
        guide_teams = Team.objects.filter(guide=guide).prefetch_related('students')
        all_students = set()
        for t in guide_teams:
            for s in t.students.all():
                all_students.add(s.id)

        tasks = Task.objects.filter(created_by=guide)
        now = timezone.now()
        active_tasks = tasks.filter(deadline__gt=now).count()

        subs = TaskSubmission.objects.filter(task__in=tasks)
        pending_subs = subs.filter(status='submitted').count()
        evaluated_subs = subs.filter(status='evaluated').count()
        avg_score = subs.filter(score__isnull=False).aggregate(a=Avg('score'))['a']

        return Response({
            'teams': guide_teams.count(),
            'students': len(all_students),
            'active_tasks': active_tasks,
            'pending_submissions': pending_subs,
            'evaluated_submissions': evaluated_subs,
            'avg_score': round(avg_score, 1) if avg_score is not None else None,
            'recent_tasks': TaskSerializer(tasks.order_by('-created_at')[:5], many=True).data,
            'recent_submissions': TaskSubmissionSerializer(subs.order_by('-submitted_at')[:5], many=True).data,
        })


# ─── Guide: Team Analysis ─────────────────────────────────────────────────────

class GuideTeamAnalysisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, team_id):
        if request.user.role != 'guide':
            return Response({'error': 'Forbidden'}, status=403)
        if not is_guide_of_team(request.user, team_id):
            return Response({'error': 'Not your team'}, status=403)

        try:
            team = Team.objects.get(id=team_id)
        except Team.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        students = list(team.students.all())
        tasks = Task.objects.filter(assignments__team=team).distinct()
        subs = TaskSubmission.objects.filter(task__in=tasks, student__in=students)

        scores = list(subs.filter(score__isnull=False).values_list('score', flat=True))
        avg_score = sum(scores) / len(scores) if scores else None
        highest = max(scores) if scores else None
        lowest = min(scores) if scores else None

        student_data = []
        for s in students:
            s_subs = subs.filter(student=s)
            s_scores = list(s_subs.filter(score__isnull=False).values_list('score', flat=True))
            s_avg = sum(s_scores) / len(s_scores) if s_scores else None
            s_avg_rounded = round(s_avg, 1) if s_avg else None
            grade = ''
            if s_avg:
                if s_avg >= 90: grade = 'A'
                elif s_avg >= 80: grade = 'B'
                elif s_avg >= 70: grade = 'C'
                elif s_avg >= 60: grade = 'D'
                else: grade = 'F'
            student_data.append({
                'id': s.id,
                'name': s.first_name or s.email,
                'email': s.email,
                'tasks': tasks.count(),
                'submitted': s_subs.count(),
                'pending': tasks.count() - s_subs.count(),
                'avg_score': s_avg_rounded,
                'grade': grade,
            })

        task_data = []
        for t in tasks:
            t_subs = subs.filter(task=t)
            t_scores = list(t_subs.filter(score__isnull=False).values_list('score', flat=True))
            t_avg = sum(t_scores) / len(t_scores) if t_scores else None
            task_data.append({
                'id': t.id,
                'title': t.title,
                'deadline': t.deadline,
                'submissions': t_subs.count(),
                'avg_score': round(t_avg, 1) if t_avg else None,
                'completion': f"{t_subs.count()}/{len(students)}",
            })

        return Response({
            'team': {
                'id': team.id,
                'name': team.name,
                'description': team.description or '',
                'students': len(students),
                'total_tasks': tasks.count(),
                'avg_score': round(avg_score, 1) if avg_score else None,
                'highest_score': highest,
                'lowest_score': lowest,
                'submission_rate': f"{subs.count()}/{tasks.count() * len(students)}" if students else '0/0',
            },
            'student_performance': student_data,
            'task_performance': task_data,
        })
