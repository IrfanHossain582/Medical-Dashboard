# SaaS Dashboard — Architecture Plan

**Stack:** Django (REST API) · Firebase Authentication · React (SPA)
**Pattern:** Firebase handles identity only. Django owns all application data in its own SQL database. React is a pure client that talks to Django over a REST API.

---

## 1. The core idea

The single most important decision in this stack is the **boundary between Firebase and Django**:

- **Firebase Authentication** is the identity provider. It owns sign-up, login, password resets, social logins, email verification, and the issuing of ID tokens. You never store passwords.
- **Django + DRF** is the application backend. It owns every piece of business data (organizations, subscriptions, dashboard records, etc.) in PostgreSQL. It does *not* manage passwords or sessions — it only *verifies* Firebase tokens.
- **React** is the frontend. It authenticates the user directly with Firebase, gets an ID token, and sends that token on every API call to Django.

Django trusts Firebase to answer "who is this user?" and takes over from there for "what is this user allowed to do, and what is their data?".

---

## 2. High-level diagram

```
┌─────────────┐   1. login (email/google)    ┌──────────────────┐
│             │ ───────────────────────────▶ │                  │
│   React     │                               │  Firebase Auth   │
│   SPA       │ ◀─────────────────────────── │  (Google)        │
│             │   2. ID token (JWT)           └──────────────────┘
│             │
│             │   3. API call + Bearer <ID token>
│             │ ───────────────────────────┐
└─────────────┘                            │
                                           ▼
                                  ┌──────────────────┐
                                  │  Django + DRF    │
                                  │                  │
                                  │  - verify token  │ ──▶ Firebase Admin SDK
                                  │    (Admin SDK)   │     (verifies signature
                                  │  - map uid→User  │      against cached keys)
                                  │  - business logic│
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │   PostgreSQL     │
                                  │  (all app data)  │
                                  └──────────────────┘
```

---

## 3. Authentication flow (the critical integration point)

This is where the three pieces connect, so it deserves the most detail.

### Login
1. React renders a login UI (or uses Firebase's pre-built UI). The user logs in via the **Firebase JS SDK** (`signInWithEmailAndPassword`, `signInWithPopup` for Google, etc.).
2. On success, Firebase returns a **User object**. React calls `user.getIdToken()` to obtain a short-lived (1 hour) **JWT ID token**.
3. React keeps the Firebase auth state in memory (the SDK persists the refresh token in IndexedDB for you) and attaches the ID token as `Authorization: Bearer <token>` on every request to Django.

### Verification (Django side)
4. Django uses the **Firebase Admin SDK** (`firebase-admin` Python package) and a custom DRF authentication class. On each request it calls `auth.verify_id_token(token)`.
5. The Admin SDK verifies the JWT signature against Google's public keys (cached locally — no per-request network call) and returns the decoded claims, including the user's `uid` and `email`.
6. Django looks up (or creates on first sight) a local `User` row keyed by the Firebase `uid`. That local row is what your foreign keys point to — Django still owns the user *record*, just not the *credentials*.

### Token refresh
- ID tokens expire after 1 hour. The Firebase JS SDK refreshes them automatically. Best practice in React: call `getIdToken()` (not `getIdToken(true)`) right before each request — the SDK returns a cached token and only hits the network when a refresh is actually needed.

### Why this design
- No password handling, no session table, no "forgot password" flow to build — Firebase does it.
- Stateless API: Django verifies the token on each call; nothing to store server-side.
- You can add Google/GitHub/Apple login later with zero backend changes.

---

## 4. Backend — Django + Django REST Framework

### Responsibilities
All business logic, validation, authorization, data persistence, and any third-party integrations (payments, email, etc.).

### Key pieces

**Custom authentication class** — a DRF `BaseAuthentication` subclass that:
- reads the `Authorization: Bearer` header,
- verifies it with `firebase_admin.auth.verify_id_token`,
- returns the matching local `User` (creating it on first login).

**User model** — a custom Django user (or a profile model) with a unique `firebase_uid` field. Keep app-specific fields here (role, organization FK, plan, etc.). Do **not** store passwords.

**Permissions** — standard DRF permissions (`IsAuthenticated`, plus custom object-level permissions for multi-tenant isolation so users only see their own organization's data).

**Apps (suggested split):**
- `accounts` — User, Organization/Tenant, membership, roles.
- `billing` — subscription/plan records (sync from Stripe later if needed).
- `core` / domain app(s) — the actual dashboard data and business logic.
- `api` — DRF viewsets, serializers, routers, the Firebase auth class.

### Suggested layout
```
backend/
├── manage.py
├── requirements.txt          # django, djangorestframework, firebase-admin, psycopg2, python-decouple
├── config/
│   ├── settings/             # base.py, dev.py, prod.py
│   ├── urls.py
│   └── wsgi.py / asgi.py
├── accounts/
│   ├── models.py             # User (firebase_uid), Organization
│   └── ...
├── api/
│   ├── authentication.py     # FirebaseAuthentication(BaseAuthentication)
│   ├── permissions.py
│   ├── serializers.py
│   ├── views.py              # DRF ViewSets
│   └── urls.py
└── core/
    └── models.py             # dashboard domain models
```

### Notes
- Store the Firebase **service account JSON** as a secret (env var / secret manager), never in git. The Admin SDK uses it to verify tokens.
- Enable CORS (`django-cors-headers`) for your React origin.
- Use environment-based settings (`python-decouple` or `django-environ`).

---

## 5. Frontend — React

### Responsibilities
UI, routing, Firebase login, token attachment, and rendering data fetched from Django. No business logic or authorization decisions live here (the client can always be tampered with — Django is the source of truth).

### Key pieces
- **Firebase JS SDK** initialized with your project's public web config (safe to ship in the bundle).
- **Auth context** — a React context/provider wrapping the app, exposing the current user and auth loading state via Firebase's `onAuthStateChanged`.
- **API client** — a thin `fetch`/`axios` wrapper with an interceptor that calls `getIdToken()` and sets the `Authorization` header on every request.
- **Protected routes** — a route guard that redirects to login when there's no Firebase user.
- **Server state** — React Query (TanStack Query) recommended for caching, loading/error states, and refetching dashboard data from Django.

### Suggested layout
```
frontend/
├── package.json              # react, react-router-dom, firebase, @tanstack/react-query, axios
├── .env                      # VITE_FIREBASE_* (public config), VITE_API_URL
└── src/
    ├── firebase.js           # initializeApp + getAuth
    ├── auth/
    │   ├── AuthProvider.jsx  # onAuthStateChanged context
    │   └── ProtectedRoute.jsx
    ├── api/
    │   └── client.js         # axios instance + token interceptor
    ├── pages/                # Login, Dashboard, Settings, ...
    ├── components/
    └── App.jsx               # router
```

Use **Vite** for the build tool (fast, modern default for React SPAs).

---

## 6. Data model (starting point)

A multi-tenant SaaS dashboard typically starts with:

- **User** — `firebase_uid` (unique), `email`, `organization` (FK), `role`, `created_at`.
- **Organization / Tenant** — `name`, `owner`, `plan`, `created_at`. Every domain record gets an `organization` FK so tenants are isolated.
- **Domain model(s)** — whatever the dashboard tracks (projects, metrics, records...), each scoped to an organization.
- **Subscription / Plan** (optional, when billing is added) — `organization`, `plan_tier`, `status`, `current_period_end`.

Tenant isolation rule: every query is filtered by the requesting user's organization, enforced in the DRF queryset (`get_queryset`) — never trust an org id sent from the client.

---

## 7. API design

- **Style:** REST over JSON, versioned under `/api/v1/`.
- **Routing:** DRF routers + ViewSets for CRUD resources.
- **Auth:** every endpoint requires a valid Firebase ID token except a small public set (health check, public marketing data if any).
- **Pagination:** DRF page-number or cursor pagination on list endpoints.
- **Example endpoints:**
  - `GET  /api/v1/me/` — current user profile (also the "ensure user exists" call after first login).
  - `GET  /api/v1/dashboard/summary/` — aggregated metrics for the org.
  - `GET/POST /api/v1/projects/` , `GET/PUT/DELETE /api/v1/projects/{id}/`.
  - `GET  /api/v1/organization/` , `PATCH /api/v1/organization/`.

---

## 8. Deployment

| Piece | Recommended host | Notes |
|-------|------------------|-------|
| React SPA | Firebase Hosting, Vercel, or Netlify | Static build; cheap/free; CDN included. |
| Django API | Render, Railway, Fly.io, or a VM | Run with Gunicorn/Uvicorn behind Nginx. |
| PostgreSQL | Managed (Render/Railway/Neon/RDS) | Don't self-manage in production. |
| Secrets | Host's env vars / secret manager | Firebase service-account JSON, DB URL, Django `SECRET_KEY`. |

Keeping React on Firebase Hosting pairs naturally with Firebase Auth (same console, easy custom domain), but any static host works since the only Firebase dependency is the client SDK config.

---

## 9. Security checklist

- Verify tokens **on every request** with the Admin SDK; never trust client-sent uid/email in the body.
- Enforce tenant isolation in the queryset layer, not just the UI.
- Lock CORS to your known frontend origin(s).
- Service-account JSON and `SECRET_KEY` live in secrets, never in the repo.
- Serve everything over HTTPS; set `SECURE_*` Django settings in production.
- Rate-limit auth-sensitive and write endpoints (DRF throttling).
- The Firebase **web config** in the React bundle is public by design — that's fine. The **service account** is the secret that must be protected.

---

## 10. Suggested build order

1. **Backend skeleton** — Django project, custom User with `firebase_uid`, PostgreSQL, DRF installed.
2. **Firebase auth class** — implement and unit-test `verify_id_token` → local user mapping; add `/api/v1/me/`.
3. **Frontend skeleton** — Vite + React, Firebase SDK, AuthProvider, login page, protected route.
4. **Wire the loop** — log in on the client, call `/api/v1/me/`, confirm the user row is created in Django.
5. **Domain features** — organization model, tenant-scoped CRUD, dashboard views.
6. **Polish** — pagination, error handling, React Query caching, deployment.

Get steps 1–4 working end-to-end first; that proves the whole integration before you build any real features on top of it.
