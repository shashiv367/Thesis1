# ThesisGuard

ThesisGuard is a comprehensive, role-based academic project and thesis management platform. It facilitates seamless collaboration between Students, Guides (Professors/Mentors), and Administrators, while ensuring academic integrity through an integrated ML-powered plagiarism detection engine.

## 🌟 Key Features

### 👨‍🎓 Student Portal
- **Dashboard Overview**: Track assigned tasks, upcoming deadlines, and academic progress.
- **Task Management**: View specific instructions and deadlines set by the assigned guide.
- **Document Submission**: Upload `.pdf`, `.doc`, and `.docx` files for review.
- **Real-Time Feedback**: View evaluated scores, detailed feedback, and grades for submitted work.

### 👨‍🏫 Guide (Mentor) Portal
- **Team Management**: Oversee multiple assigned student teams and track aggregate performance.
- **Task Assignment**: Create and distribute tasks either globally (to all teams) or to specific teams.
- **Document Review**: Inspect and download student submissions.
- **Plagiarism Analysis**: Run synchronous ML-powered semantic similarity checks on submitted documents.
- **Evaluation**: Score student submissions and provide constructive feedback.

### 👑 Admin Portal
- **Centralized Control**: Manage all platform accounts (Students, Guides, Admins).
- **Team Assembly**: Create teams, assign students to them, and allocate teams to specific Guides.
- **Dashboard Analytics**: High-level overview of the entire institution's academic activity.

### 🛡️ ML Plagiarism Engine
- **Local Vector Database**: Utilizes `ChromaDB` for secure, on-premise document indexing.
- **Semantic Similarity**: Powered by `SentenceTransformers` (`all-MiniLM-L6-v2`) to detect semantic matches and paraphrasing, not just exact copy-pasting.
- **Automated Text Extraction**: Supports parsing from PDF and DOCX files automatically upon submission.

---

## 🏗️ Architecture Stack

**Frontend:**
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Data Fetching**: Axios

**Backend:**
- **Framework**: Django & Django REST Framework (DRF)
- **Language**: Python 3
- **Database**: SQLite (Development)
- **Authentication**: DRF Token Authentication
- **Machine Learning**: `sentence-transformers`, `ChromaDB`, `PyPDF2`, `python-docx`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.10+)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/shashiv367/Thesis1.git
cd Thesis1
```

### 2. Backend Setup (Django)
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Apply migrations
python manage.py migrate

# Create a superuser (Admin account)
python manage.py createsuperuser

# Start the Django development server
python manage.py runserver 8000
```
*The backend API will run at `http://localhost:8000`*

### 3. Frontend Setup (Next.js)
Open a new terminal window:
```bash
cd frontend

# Install Node dependencies
npm install

# Start the Next.js development server
npm run dev
```
*The frontend application will run at `http://localhost:3000`*

---

## 📂 Repository Structure

```text
Thesis1/
├── backend/                  # Django REST API
│   ├── core/                 # Django settings and main urls
│   ├── projects/             # Tasks, Submissions, and Evaluation logic
│   ├── users/                # Custom User model, Roles, and Teams
│   ├── plagiarism_engine/    # ML semantic analysis and ChromaDB integration
│   ├── media/                # User uploaded files (ignored in git)
│   ├── requirements.txt      # Python dependencies
│   └── manage.py
│
├── frontend/                 # Next.js Application
│   ├── src/
│   │   ├── app/              # Next.js App Router (Pages & Layouts)
│   │   │   ├── dashboard/    # Protected routes
│   │   │   │   ├── admin/    # Admin dashboard pages
│   │   │   │   ├── guide/    # Guide dashboard pages
│   │   │   │   └── student/  # Student dashboard pages
│   │   │   └── login/        # Authentication UI
│   │   ├── components/       # Reusable UI components (Sidebar, Header)
│   │   └── lib/              # Utilities and API config
│   ├── package.json          # Node dependencies
│   └── tailwind.config.ts    # Tailwind styling config
│
└── .gitignore                # Root gitignore file
```
