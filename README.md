# Mojaz International Vehicle Report

A bilingual (Arabic/English, RTL-aware) Next.js app for requesting Mojaz international vehicle reports by VIN, previewing/downloading the resulting PDF, and keeping a local history of past inquiries.

## Key Features

- **VIN inquiry**: validates a 17-character VIN, creates a Mojaz request, and polls until the PDF report is ready (this can take anywhere from ~10 seconds to a few minutes - the UI shows live progress).
- **PDF preview & download**: in either language, independently of which language the original inquiry used (re-fetches via `requestId`, never re-running - and re-billing - the inquiry step).
- **Inquiry history**: stored client-side in IndexedDB (metadata only - VIN, requestId, timestamp, status - never the PDF itself). Failed fetches are flagged with a manual Retry action.
- **Environment override**: testers can point their browser at a different Mojaz backend (base URL, credentials, extra headers) via `/settings` or a deep link, gated server-side by `CONFIG_OVERRIDE_TOKEN` so this can never be used to redirect the server to an arbitrary host without that shared secret.
- **Full AR/EN localization**, including server-generated error messages.

## Tech Stack

- **Next.js 16** (App Router, Turbopack), **React 19**, **TypeScript**
- **Tailwind CSS v4**
- **axios** for the upstream Mojaz API calls
- **lucide-react** icons
- Docker (multi-stage, `output: "standalone"`) for both local dev and production

## Local Development

### Option A: Docker (recommended - matches production environment)

```bash
cp .env.example .env   # fill in real values
docker compose up -d --build
```

Opens at [http://localhost:3000](http://localhost:3000). `docker-compose.yml` builds only the `builder` stage (full toolchain, hot reload via `next dev`) - the production `runner` stage is never used locally.

### Option B: Node directly

Requires Node 20.9+ (Next.js 16 requirement).

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Environment Variables

See [.env.example](.env.example) for the full annotated list. The essentials:

| Variable | Required | Description |
|---|---|---|
| `MOJAZ_BASE_URL` | Yes | Mojaz API base URL |
| `MOJAZ_CLIENT_KEY` | Yes | Mojaz API client key |
| `MOJAZ_APP_ID` | Yes | Mojaz API app id |
| `MOJAZ_APP_KEY` | Yes | Mojaz API app key |
| `MOJAZ_LANGUAGE` | No (default `ar`) | Default report language if a request doesn't specify one |
| `MOJAZ_REQUEST_TIMEOUT` | No (default `30000`) | Per-HTTP-call timeout to Mojaz, ms |
| `MOJAZ_POLLING_INTERVAL` | No (default `20000`) | Delay between report-ready polls, ms |
| `MOJAZ_POLLING_MAX_RETRIES` | No (default `9`) | Max poll attempts before giving up (9 × 20s ≈ 3 min ceiling) |
| `ALLOWED_ORIGINS` | No | Comma-separated origins allowed to call `/api/*` cross-domain; `*` for any, empty for same-origin only |
| `CONFIG_OVERRIDE_TOKEN` | No | Enables the client-side environment override feature (`/settings`); unset = feature fully disabled |

**Never commit `.env`/`.env.local`** - they're gitignored. In production, set these as platform secrets (see Deployment below), not as plaintext config.

## Available Scripts

```bash
npm run dev         # Development server
npm run build       # Production build
npm start           # Start a production build (after `npm run build`)
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
```

## API Endpoints

### `GET /api/international-report?vin=<vin>&lang=<ar|en>`
Runs the full inquiry → poll → PDF flow. `lang` is optional (falls back to `MOJAZ_LANGUAGE`).

### `GET /api/international-report/retrieve?requestId=<id>&lang=<ar|en>`
Re-fetches a PDF for a previously obtained `requestId` without re-running the inquiry step. Used by the history Preview/Download/Retry actions.

### `GET /api/health`
Liveness check used by Docker's `HEALTHCHECK` and the platform's HTTP health checks. No upstream dependency - reflects only whether this app is running.

Both report endpoints return:
```json
{ "success": true, "requestId": "87966", "pdfBase64": "JVBERi0..." }
```
or, on failure (with `requestId` populated if the inquiry step itself succeeded, so the UI can offer a retry):
```json
{ "success": false, "requestId": "87966", "pdfBase64": "", "error": "..." }
```

## Deployment (Fly.io)

This app runs as a long-lived container (not a serverless function) because a single report request can poll for up to a few minutes - that's incompatible with typical serverless function timeout limits.

One-time setup:
```bash
fly auth login
fly launch --no-deploy   # creates the app on Fly using fly.toml; pick a different app name if "mojaz-international" is taken
fly secrets set MOJAZ_BASE_URL=... MOJAZ_CLIENT_KEY=... MOJAZ_APP_ID=... MOJAZ_APP_KEY=...
```

Then either:
- `fly deploy` manually, or
- push to `main` - the GitHub Actions workflow ([.github/workflows/ci-cd.yml](.github/workflows/ci-cd.yml)) lints, typechecks, builds, and deploys automatically, given a `FLY_API_TOKEN` repo secret (`fly tokens create deploy`).

Fly provides a free `<app-name>.fly.dev` domain with TLS automatically. A custom domain can be attached later with `fly certs add yourdomain.com`.

## Security Notes

- Mojaz credentials are server-side only, read from environment variables - never exposed to the client.
- VIN input is validated (exactly 17 characters, `I`/`O`/`Q` excluded) both client- and server-side.
- Simple in-memory rate limiting (100 requests / 15 min / IP). Note: this resets on every deploy/restart and isn't shared across multiple instances - acceptable for a single-instance deployment, but swap in Redis-backed limiting before scaling horizontally.
- The environment-override feature (`/settings`) is inert unless `CONFIG_OVERRIDE_TOKEN` is set server-side and the client's request includes a matching token - a client can never redirect the server to an arbitrary host or inject arbitrary upstream headers without that shared secret.
