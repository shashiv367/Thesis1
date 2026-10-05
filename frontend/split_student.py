import os
import re

base_dir = r'd:\Shashi\Thesis\frontend\src\app\dashboard\student'
source_file = os.path.join(base_dir, 'page.tsx')

with open(source_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the tab bar JSX
tab_bar_regex = re.compile(r'<div className="flex space-x-2 border-b border-gray-200 overflow-x-auto pb-1 scrollbar-hide">.*?</div>', re.DOTALL)
content = tab_bar_regex.sub('', content)

tabs = {
    'overview': 'page.tsx',
    'upload': r'upload\page.tsx',
    'tasks': r'tasks\page.tsx',
    'submissions': r'submissions\page.tsx',
    'grades': r'grades\page.tsx',
    'settings': r'settings\page.tsx'
}

for tab, rel_path in tabs.items():
    # Replace the default activeTab
    new_content = re.sub(
        r'useState<"overview" \| "upload" \| "tasks" \| "submissions" \| "grades" \| "settings">\("overview"\)',
        f'useState<"overview" | "upload" | "tasks" | "submissions" | "grades" | "settings">("{tab}")',
        content
    )
    
    # write to file
    out_path = os.path.join(base_dir, rel_path)
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
print("Successfully generated all student sub-pages.")
