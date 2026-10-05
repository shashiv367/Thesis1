import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import User

def create_users():
    admin_user = User.objects.filter(username='admin').first()
    if not admin_user:
        User.objects.create_superuser('admin', 'admin@thesis.com', 'admin@135', role='admin')
        print("Created admin user (admin/admin@135)")
    else:
        admin_user.set_password('admin@135')
        admin_user.save()
        print("Updated admin password to admin@135")

    # Delete existing default users if any
    User.objects.filter(username__in=['guide', 'student']).delete()
    User.objects.filter(email__in=['guide@thesis.com', 'student@thesis.com']).delete()
    print("Cleaned up default demo users")

if __name__ == '__main__':
    create_users()
