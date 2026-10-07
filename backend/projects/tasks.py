from celery import shared_task

from plagiarism_engine.analyzer import get_analyzer

from .models import Submission


@shared_task
def process_plagiarism_check(submission_id):
    try:
        submission = Submission.objects.get(id=submission_id)

        # Read the file content
        try:
            with submission.file.open("r") as f:
                content = f.read()
                if isinstance(content, bytes):
                    content = content.decode("utf-8", errors="ignore")
        except Exception:
            # Fallback mock text if reading binary/PDF fails in this prototype
            content = "This is a sample student submission text that might contain plagiarized content from the corpus."

        analyzer = get_analyzer()
        score, matches = analyzer.check_plagiarism(content)

        # Update submission with async results
        submission.plagiarism_score = score
        submission.save()

        return score
    except Submission.DoesNotExist:
        return None
