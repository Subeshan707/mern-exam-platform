# Exam Platform — Frontend

React (Vite) frontend for the Online Exam Platform.

Includes separate layouts for **Admin** and **Student**, JWT auth, Socket.io client integration (auto-save + monitoring), and pages for exams, groups, students, results, and reports.

## Requirements

- Node.js >= 16

## Setup

```bash
npm install
```

### Environment variables

Create `frontend/.env` (or copy from `frontend/.env.example`).

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## Run

```bash
npm run dev
```

App default: http://localhost:5173

## Build

```bash
npm run build
npm run preview
```

## Notes

- API requests are handled via `src/api/axios.js` and automatically attach the access token.
- If the API returns `401`, the app will attempt to refresh the token via `POST /api/auth/refresh`.
