# Loggiskabir Dispatcher Dashboard

React + Vite admin/dispatcher dashboard for NEMT operations (bookings, drivers, trip history, CMS, reports).

## Requirements

- Node.js **≥ 22.12** (see `package.json` engines)
- npm

## Setup

```bash
npm install
cp .env.example .env
```

Edit `.env`:

| Variable | Purpose |
|----------|---------|
| `VITE_API_BASE_URL` | Backend API base (e.g. `https://api.example.com/api/v1`) |
| `VITE_IMAGE_BASE_URL` | Media host for `/image/...` paths |
| `VITE_GOOGLE_MAPS` | Google Maps JavaScript API key |
| `VITE_FIREBASE_*` | FCM / web push (login device token) |

## Scripts

```bash
npm run dev        # local dev server
npm run build      # production bundle → dist/
npm run preview    # serve dist (port 6001)
npm run typecheck  # TypeScript
npm run lint       # ESLint + typography check
```

## Architecture (short)

- **UI:** `src/features/*` (domain screens), `src/pages/*` (lazy route entry)
- **API:** RTK Query in `src/redux/api/*`, registered via `src/redux/apis.ts`
- **Auth:** Bearer token in localStorage; `src/redux/baseApi.ts` attaches headers

Legacy `src/services/*` + `useMock` remain for optional demo mode only; production builds should use live APIs via RTK Query.

## Deploy

1. Set production env vars on the host (CI/CD secrets).
2. `npm run build`
3. Serve `dist/` as static files (SPA: fallback to `index.html`).

## Client handoff notes

- Do not commit `.env` with secrets.
- `.cursor/` is editor tooling — optional for client repo.
- API contract: align query params with backend (`page`, `limit`, `search`, etc.) per feature.
