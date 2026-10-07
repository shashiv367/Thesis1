from django.apps import AppConfig


class ProjectsConfig(AppConfig):
    name = "projects"

    def ready(self):
        # Preload the ML model asynchronously on startup so it doesn't block the first request
        import threading
        from plagiarism_engine.analyzer import get_analyzer
        threading.Thread(target=get_analyzer, daemon=True).start()
