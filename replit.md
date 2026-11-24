# FinTwin workspace notes

## Architecture and status

This pnpm/TypeScript workspace contains:

- `artifacts/mobile`: Expo Router app with Clerk authentication and finance
  records stored in AsyncStorage by Clerk user ID. Do not silently discard or
  migrate these records.
- `artifacts/api-server`: Express API with Supabase bearer-token validation,
  profile endpoints, `/api/healthz`, and a server-only Gemini coach. Mobile
  Clerk tokens are incompatible with this Supabase authentication.
- `artifacts/mockup-sandbox`: Vite component preview, not a web product or PWA.
- `lib/db`: Drizzle models, not verified against the live database.
- `lib/api-spec`, `lib/api-zod`, and `lib/api-client-react`: OpenAPI source
  and generated contracts/client. Regenerate generated artifacts through the
  existing tooling when changing schemas.

This application is not production-ready. No verified RLS, cloud finance
storage, mobile Supabase sign-in, password reset, APK or production deployment
is available yet.

## Commands and configuration

Use [README.md](README.md) for Windows PowerShell installation, development,
USB, build and test commands, and [.env.example](.env.example) for names.
The API reads process environment variables; a root `.env` is not loaded
automatically. Never place secrets in `EXPO_PUBLIC_*` or `VITE_*` variables.
Avoid logging credentials, access tokens, questions, or financial snapshots.

## Database safety

Inspect the existing Supabase schema first using
[lib/db/MIGRATIONS.md](lib/db/MIGRATIONS.md). Never run `drizzle-kit push` or
`push-force` against an existing production database without an independently
reviewed migration and backup. A direct PostgreSQL connection may bypass RLS,
especially with the postgres role. RLS and application-level authorization
must both be verified with multiple real users.

## Operations

The API health endpoint is `/api/healthz`. Configure exact `CORS_ORIGINS`,
TLS termination and the required environment variables before deployment.
AI limits are per-process, not distributed; a shared enforcement mechanism is
required for production multi-instance deployments. No credentials or external
deployment should be performed by an agent without authorization.
