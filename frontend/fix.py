import os
files = [r'd:\Shashi\Thesis\frontend\src\app\dashboard\admin\page.tsx', r'd:\Shashi\Thesis\frontend\src\app\dashboard\admin\manage-accounts\page.tsx']
for p in files:
    with open(p, 'r', encoding='utf-8') as f:
        c = f.read()
    c = c.replace('outline-none"', 'outline-none text-gray-900"')
    c = c.replace('h-32"', 'h-32 text-gray-900"')
    with open(p, 'w', encoding='utf-8') as f:
        f.write(c)
