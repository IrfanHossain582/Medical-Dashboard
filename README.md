# Medical Dashboard

A SaaS dashboard built with **Django (REST API)** · **Firebase Authentication** · **React (SPA)**.

See `architecture-plan.md` for the full design. This README covers what to install and how to get started.

---

## What to install on your laptop

### 1. Core languages & runtimes

| Tool | Why | Recommended version | Get it |
|------|-----|---------------------|--------|
| **Python** | Runs the Django backend | 3.11 or 3.12 | https://www.python.org/downloads/ |
| **Node.js** (includes npm) | Runs the React frontend & build tools | LTS (20.x or 22.x) | https://nodejs.org/ |
| **Git** | Version control | latest | https://git-scm.com/downloads |
| **PostgreSQL** | The app database | 15 or 16 | https://www.postgresql.org/download/ |

> SQLite ships with Python, so you *can* start without installing PostgreSQL and switch later. For a real SaaS, install PostgreSQL from the start.

### 2. A code editor
- **VS Code** (recommended): https://code.visualstudio.com/
  - Helpful extensions: Python, Pylance, ESLint, Prettier.

### 3. Accounts (no install, but set these up)
- **Firebase project** — create one free at https://console.firebase.google.com/
  - Enable **Authentication** → Email/Password (and Google if you want social login).
  - Get the **web config** (for React) and a **service account key** JSON (for Django).

### 4. Python packages (installed per-project, inside the backend venv)
```
django
djangorestframework
firebase-admin
psycopg2-binary
django-cors-headers
python-decouple
```

### 5. Node packages (installed per-project, inside the frontend folder)
```
react  react-dom  react-router-dom
firebase
@tanstack/react-query
axios
vite  @vitejs/plugin-react   (dev tooling)
```

---

## Verify your installs

Open a terminal and run:
```bash
python --version      # or: python3 --version   -> 3.11+
node --version        # -> v20+ or v22+
npm --version
git --version
psql --version        # -> 15 or 16
```

---

## Project structure (to be built)

```
medical dashboard/
├── README.md                # this file
├── architecture-plan.md     # full architecture design
├── backend/                 # Django + DRF API
└── frontend/                # React (Vite) SPA
```

---

## Quick start (once tools are installed)

**Backend**
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate
pip install django djangorestframework firebase-admin psycopg2-binary django-cors-headers python-decouple
django-admin startproject config .
python manage.py runserver
```

**Frontend**
```bash
cd frontend
npm create vite@latest . -- --template react
npm install
npm install firebase @tanstack/react-query axios react-router-dom
npm run dev
```

Then follow the **build order** in `architecture-plan.md` (section 10) to wire Firebase Auth → Django → React together.
