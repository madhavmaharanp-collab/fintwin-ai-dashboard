# FinTwin

FinTwin is an Expo/React Native personal-finance prototype with an Express API.
The pnpm workspace also contains a Vite component-preview server, Drizzle
database models, and generated API types and clients.

## Current status: not production-ready

- The mobile app uses Clerk and stores financial records locally per Clerk
  user ID. The API validates Supabase Auth tokens, so the existing mobile AI
  coach cannot authenticate to it. Do not remove Clerk or local storage until
  an account and data migration is designed and tested.
- The database models and Supabase profile endpoints are not a complete cloud
  persistence implementation. The live schema and RLS have not been inspected,
  and no migration has been applied. Do not push this schema to an existing
  database. See [database migration guidance](lib/db/MIGRATIONS.md).
- The Vite app is a component preview, not a complete web dashboard or PWA.
  The mobile appearance supports light (default), dark, and system settings.
- The AI endpoint uses Gemini on the server. It validates input and responses
  and applies per-user and instance-wide limits, but those limits are
  in-memory, reset on restart, and do not coordinate across instances. Use a
  shared rate-limit store or a gateway before scaling or production use.
- Earlier project documentation claimed production readiness incorrectly.
  No APK, release bundle, deployment or device test is claimed.

## Prerequisites and installation (Windows PowerShell)

Use Node.js 24 and pnpm. From the workspace root:

```powershell
cd G:\Fintwin-AI-Dashboard\Fintwin-AI-Dashboard
pnpm install --frozen-lockfile
```

pnpm may require `pnpm approve-builds` for dependency lifecycle scripts.
Review them before approving. For the existing toolchain, installation without
running them was verified using:

```powershell
pnpm install --frozen-lockfile --ignore-scripts --config.strict-dep-builds=false
```

Native dependencies may need their approved build scripts in other environments.

## Configuration and security

[.env.example](.env.example) lists configuration names and placeholder
database credentials. Do not commit environment files, private keys or
passwords. The API does **not** automatically load the root `.env`; set its
environment in the process or use your hosting provider's secret manager.
For local development, set `PORT`, `DATABASE_URL`, `SUPABASE_URL`,
`SUPABASE_PUBLISHABLE_KEY`, and `GEMINI_API_KEY` privately. Configure
`CORS_ORIGINS` with the exact web origins in use. The mobile app currently
also needs `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`.

The Supabase publishable key is public; database passwords and Gemini keys
must remain server-side. The database pooler URLs in the template require
your password, percent-encoded if necessary; use TLS in production. `DIRECT_URL`
selects the session pooler for Drizzle tooling. The existing backend uses a
direct PostgreSQL connection; a privileged database role can bypass RLS.
Policies, database roles, API authorization, and data isolation all need
verification before deployment.

**Rotate the Gemini key previously exposed in project files** and configure
the replacement privately. Do not paste credentials into chat.

## Development

In separate PowerShell terminals, after configuring the necessary environment:

```powershell
# API: starts a built server; rebuild/restart after changes.
$env:PORT = "5000"
pnpm --filter @workspace/api-server run dev
```

```powershell
# Component preview (not the FinTwin dashboard).
$env:PORT = "5173"
$env:BASE_PATH = "/"
pnpm --filter @workspace/mockup-sandbox run dev
```

## Android over USB

The project already uses Expo; Capacitor would duplicate the native app.
Install Android platform-tools, Android Studio/SDK and a compatible JDK, enable
Developer Options and USB debugging on the phone, then authorize the computer.
With a development client or compatible Expo Go installed:

```powershell
adb devices
adb reverse tcp:8081 tcp:8081
adb reverse tcp:5000 tcp:5000
$env:EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY = "<your public Clerk key>"
$env:EXPO_PUBLIC_API_URL = "http://127.0.0.1:5000"
pnpm --filter @workspace/mobile run dev:usb
```

Open the Metro URL `exp://127.0.0.1:8081` on the phone as appropriate for
the installed client. Both the API and Metro must remain running. USB reverse
is for local development; production API URLs must use HTTPS. The current
Clerk/Supabase mismatch still prevents AI requests. Device compatibility,
network security policy, and this procedure have not been tested on a phone.

## Android and iOS builds

The existing icon and splash are configured, and
[eas.json](artifacts/mobile/eas.json) defines a preview APK and production
Android App Bundle. `com.fintwin.dashboard` is a **provisional** Android
package and iOS bundle identifier: choose an identifier you control before
signing or publishing. Install EAS CLI, sign in to your own Expo account and,
from `artifacts\mobile`, run:

```powershell
eas build --platform android --profile preview
eas build --platform android --profile production
```

EAS cloud builds require account authorization and signing credentials.
Download a completed preview APK and install it with
`adb install -r <path-to-apk>`. Store signing keys securely and back them up;
configure Google Play App Signing and follow Play Console requirements.
An iOS release requires an Apple Developer account, certificates and
provisioning. Local iOS builds and App Store submission require macOS and Xcode;
use `eas build --platform ios --profile production` if using EAS cloud.
No application has been published.

## Verification

```powershell
pnpm run typecheck
pnpm --filter @workspace/scripts exec tsx --test 'G:\Fintwin-AI-Dashboard\Fintwin-AI-Dashboard\artifacts\api-server\test\ai.test.ts' 'G:\Fintwin-AI-Dashboard\Fintwin-AI-Dashboard\artifacts\api-server\test\supabase-auth.test.mjs'
pnpm --filter @workspace/api-server run build
$env:PORT = "5173"; $env:BASE_PATH = "/"
pnpm --filter @workspace/mockup-sandbox run build
```

These are not a substitute for real Supabase, Gemini, Android, accessibility,
security and deployment testing. The mobile `build` script targets a
Replit-specific static build and is not an Android APK command.
