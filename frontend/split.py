
import os
import shutil

base_dir = r'd:\Shashi\Thesis\frontend\src\app\dashboard\student'
# create dirs
for d in ['upload', 'tasks', 'submissions', 'grades', 'settings']:
    os.makedirs(os.path.join(base_dir, d), exist_ok=True)

# We will just write the files directly. I'll write the python script to generate each file with the necessary logic.

