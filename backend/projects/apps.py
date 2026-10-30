import os
import sys
import threading
from django.apps import AppConfig


class ProjectsConfig(AppConfig):
    name = "projects"

    def ready(self):
        # Pre-warm the SentenceTransformer model in a background daemon thread
        # immediately when Django starts up (but NOT in the stat-reloader parent
        # process - only in the actual request-serving child process).
        is_in_worker = (
            os.environ.get("RUN_MAIN") == "true"       # Django dev server worker
            or "runserver" not in sys.argv              # any other command (gunicorn, etc.)
        )
        if is_in_worker:
            def _prewarm():
                try:
                    from plagiarism_engine.analyzer import get_analyzer
                    get_analyzer()
                except Exception:
                    pass

            t = threading.Thread(target=_prewarm, daemon=True, name="plagiarism-prewarm")
            t.start()

