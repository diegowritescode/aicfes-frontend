# AICFES Frontend

Modern web client for the AICFES exam prep platform. Built to support gamified study flows, real metrics, realtime dashboard updates, and AI feedback.

## Features
- Auth flow with JWT + refresh cookie, protected routes, and logout.
- Dashboard with realtime updates (SSE) and polling fallback.
- Study session lifecycle: start, heartbeat, complete.
- Generation modes:
  - Specialized: single area, difficulty, 1-20 questions.
  - Mixed: multi-section builder with shuffle support.
  - Time trial: preset and custom modes with time limit + speed bonus.
- Results view with auto feedback generation.
- Dedicated AI feedback page with metrics, strengths, weaknesses, and plan.
- Skeleton loaders across data-heavy views.
- Animated time trial timer, progress bar, and tick-tock audio.

## Tech Stack
- React 18 + TypeScript
- Vite (port 8080 by default)
- Tailwind CSS + shadcn/ui
- React Router
- React Query
- Axios

## Local Setup
Requirements: Node 18+ and npm.

```bash
npm install
npm run dev
```

The app runs on `http://localhost:8080`.

## Environment Variables
Create a `.env.local` file with the backend base URL:

```
VITE_API_URL=http://localhost:3000
```

## Scripts
```bash
npm run dev        # start dev server
npm run build      # production build
npm run build:dev  # build with development mode
npm run preview    # preview production build
npm run lint       # eslint
```

## Key Routes
- `/dashboard`
- `/generacion-especializada`
- `/generacion-mixta`
- `/contrarreloj`
- `/test`
- `/results`
- `/feedback/:sessionId`

## Backend Integration (Summary)
The UI expects these endpoints:
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`
- Dashboard: `/api/dashboard`, `/api/dashboard/stream` (SSE)
- Sessions: `/api/study-sessions/start`, `/api/study-sessions/:id/heartbeat`, `/api/study-sessions/:id/complete`
- Generation:
  - `/api/items/generate` (specialized)
  - `/api/items/generate-mixed` (mixed)
- Answers: `/api/answers`
- Time trial: `/api/time-trial/modes`, `/api/time-trial/start`
- Feedback: `/api/feedback/generate`, `/api/feedback/:sessionId`

## Notes
- SSE uses cookies by default (no custom headers in EventSource).
- Feedback is cached in `sessionStorage` per sessionId to avoid re-generation on back navigation.
- Time trial UI displays minutes to users, but the backend uses seconds.

## Docs
See `docs/` for backend contracts and integration notes:
- `docs/TIME_TRIAL_BACKEND_SPEC.md`
- `docs/AI_FEEDBACK_BACKEND_SPEC.md`
- `docs/FEEDBACK_PROMPT_ENHANCEMENTS.md`
