# Setup & Run Guide

Stack: **Django REST Framework** (API) · **JWT auth** (self-contained, no external
service) · **React + Vite** (SPA). Database is **SQLite** by default — nothing
external to install to start.

The repo is split into `backend/` (Django API) and `frontend/` (React SPA).

---

## 1. Backend (Django)

```bash
cd backend

# create + activate a virtual environment
python -m venv venv
venv\Scripts\activate            # Windows PowerShell: venv\Scripts\Activate.ps1
# source venv/bin/activate       # macOS / Linux

pip install -r requirements.txt

# configure environment
copy .env.example .env           # Windows  (use: cp on macOS/Linux)
#   then edit .env — at minimum set a real SECRET_KEY

# database (SQLite by default — no Postgres needed)
python manage.py migrate

# seed demo data + an admin login (admin / admin12345)
python manage.py seed_demo
# ...or create your own admin:  python manage.py createsuperuser

python manage.py runserver        # serves http://localhost:8000
```

Quick check: open http://localhost:8000/api/v1/health/ → `{"status": "ok"}`.

> **Postgres later:** set `USE_SQLITE=False` in `.env`, fill the `DATABASE_*`
> values, `pip install "psycopg[binary]"`, create the DB, then re-run `migrate`.

---

## 2. Frontend (React)

```bash
cd frontend
npm install
copy .env.example .env           # VITE_API_URL already points at :8000
npm run dev                       # serves http://localhost:5173
```

---

## 3. Pages & URLs

| URL | What |
|-----|------|
| `/` | **Public website** — hero doctor slider, services, facilities, doctors, testimonials, contact form |
| `/account/login` | **Patient login/register** (email/password + Google) |
| `/account` | **Patient profile** — their appointment, test & payment history |
| `/book` | **Booking** (login required) — doctor → date → slots → confirm |
| `/login` | Staff login (not linked from the public site) |
| `/admin` | **Admin dashboard** (after login) — KPIs + sidebar incl. Messages |

### Patient accounts & Google login
Patients self-register on the website; **booking and contact require a patient
login**. Email/password works out of the box. To enable **"Continue with
Google"**, create an OAuth 2.0 Web client in Google Cloud Console and set the
same client ID in two places:
- `backend/.env` → `GOOGLE_CLIENT_ID=...`
- `frontend/.env` → `VITE_GOOGLE_CLIENT_ID=...`
Add `http://localhost:5173` as an authorized JavaScript origin. Without it, the
Google button shows a hint and email/password still works.

### Contact messages
The website contact form (login-gated) saves to the DB. Admins read/manage them
under **Messages** in the dashboard (unread count shows on the dashboard home).

### Verify the full loop
1. Both servers running (`:8000` and `:5173`).
2. Open http://localhost:5173 → the **website** loads. Click **Book Appointment**.
3. Click **Staff Login** (or go to `/login`) → log in with **admin / admin12345**.
4. You land on **/admin** — the Dashboard with live KPIs. The sidebar manages
   Patients, Doctors, Appointments, Tests, Lab orders, Payments, Locations, Staff.

Auth flow: login calls `POST /api/v1/auth/token/` and stores the JWT access +
refresh tokens in `localStorage`. Every API request sends `Authorization: Bearer
<access>`; on expiry the client transparently refreshes via
`/api/v1/auth/token/refresh/`.

---

## What's included

**Backend**
- `config/` — settings (SQLite/Postgres toggle, DRF, JWT, CORS, filters), URLs.
- `accounts/` — custom `User` (role-based: admin / receptionist / doctor / lab /
  accountant), `Organization`, admin.
- `core/` — the medical domain: `Location`, `Doctor` (+ `DoctorAvailability`),
  `Patient`, `Appointment`, `MedicalTest`, `TestOrder`, `Payment`; serializers,
  viewsets (with location/doctor/status filtering), and a `dashboard/summary/`
  KPI endpoint. `management/commands/seed_demo.py` seeds demo data.
- `api/` — JWT token endpoints, `register`, `me`, admin-only `users` viewset
  (staff + role assignment), router wiring all resources under `/api/v1/`.

**Frontend**
- `src/api/client.js` — axios instance with JWT attach + auto-refresh.
- `src/api/hooks.js` — generic React Query list/save/delete + summary hooks.
- `src/auth/` — `AuthProvider` (login/logout/me) + `ProtectedRoute`.
- `src/components/` — `Layout` (sidebar) + `CrudResource` (reusable list/create/
  edit/delete with search & filters).
- `src/pages/` — `Dashboard`, `Patients`, `Doctors`, `Appointments`, `Tests`,
  `Payments`, `Locations`, `Staff`.

## Key API endpoints (`/api/v1/`)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `auth/token/` | Log in → access + refresh JWT |
| POST | `auth/token/refresh/` | Refresh access token |
| POST | `auth/register/` | Create account (1st becomes admin) |
| GET  | `me/` | Current user profile |
| GET  | `dashboard/summary/?location=` | KPIs (optionally per location) |
| CRUD | `patients/` `doctors/` `appointments/` `tests/` `test-orders/` `payments/` `locations/` `availability/` | Domain resources |
| CRUD | `users/` | Staff + role management (admin only) |
| GET  | `public/doctors/` | (public) active doctors for the booking site |
| GET  | `public/slots/?doctor=&date=` | (public) available time slots that day |
| POST | `public/book/` | (public) book a slot → website appointment + email |

List endpoints support `?search=`, plus filters like `?location=`, `?doctor=`,
`?status=`, `?method=` (see each viewset's `filterset_fields`).

## Public booking website
Visit **http://localhost:5173/book** (also linked from the login page). Patients
pick a doctor, choose a date, see doctor-wise available time slots (computed from
`DoctorAvailability` minus already-booked appointments), and confirm with their
details. This creates a `source=website` appointment visible in the admin
Appointments list and sends a **confirmation email**.

**Email:** dev uses Django's console backend — confirmation emails print to the
backend `runserver` output, so it works with no SMTP account. For real delivery,
set these in `backend/.env`:
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.yourprovider.com
EMAIL_HOST_USER=...
EMAIL_HOST_PASSWORD=...
DEFAULT_FROM_EMAIL=Your Clinic <bookings@yourclinic.com>
CLINIC_NAME=Your Clinic
```
Slots are driven by each doctor's weekly availability — add it under a doctor in
the Django admin (`/admin/` → Doctors) or via the `availability/` API.

## Not yet built (planned next slices)
GHL/n8n webhooks & API keys (inbound/outbound data), and the website/admin
chatbots over an auto-updating knowledge base. The data model already
accommodates them (e.g. `Appointment.source` distinguishes manual/website/api).
