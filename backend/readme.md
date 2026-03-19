# Exam Platform — Backend

Express + MongoDB backend for the Online Exam Platform. Provides JWT auth (access + refresh), admin/student management, exam lifecycle, results & reporting, and Socket.io events for real-time monitoring and auto-save.

## Requirements

- Node.js >= 16
- MongoDB >= 5

## Setup

```bash
npm install
```

### Environment variables

Create `backend/.env` (or copy from `backend/.env.example`).

Required:

```env
MONGODB_URI=mongodb://localhost:27017/exam-platform
JWT_SECRET=replace_me
FRONTEND_URL=http://localhost:5173
```

Optional (recommended):

```env
PORT=5000
NODE_ENV=development
JWT_REFRESH_SECRET=replace_me_or_leave_empty

ADMIN_EMAIL=admin@examplatform.com
ADMIN_PASSWORD=Admin@123

EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_smtp_user
EMAIL_PASS=your_smtp_password
EMAIL_FROM=no-reply@example.com
```

## Run

```bash
npm run dev
```

Server default: http://localhost:5000

Health checks:
- `GET /health`
- `GET /api/health`

## Default admin

On startup, `server.js` attempts to create a default admin if none exists:

- Username: `admin`
- Email/password: `ADMIN_EMAIL` / `ADMIN_PASSWORD` (or the fallback values logged to console)

## API routes (high level)

Base path: `/api`

- `/auth/*` — login/register/refresh/logout/password flows
- `/groups/*` — group management
- `/students/*` — student management
- `/exams/*` — exam creation, publishing, attempts, violations
- `/results/*` — result views and updates
- `/reports/*` — analytics and exports
- `/dashboard/*` — overview endpoints

## Socket.io

Socket server runs on the same host/port as the API.

Client must connect with `auth: { token }` where `token` is the access token.

Events used by the frontend include:
- `join-exam` (examId, attemptId)
- `auto-save` ({ attemptId, answers })
- `violation` ({ attemptId, type, details })

## Quality

```bash
npm run lint
npm test
```