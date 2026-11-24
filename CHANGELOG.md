# Changelog

## Unreleased

- Corrected previous inaccurate production-readiness and RLS claims.
- Added Supabase Auth token verification on the API. Mobile still uses Clerk;
  those identities and tokens are not interchangeable.
- Added per-user and per-instance Gemini request limits, bounded request
  bodies, chart alignment validation and backend regression tests. Limits are
  in-memory and are not sufficient for multi-instance production use.
- Added persistent light, dark and system appearance choices, defaulting to
  light; refined shared cards, buttons, touch targets and tab spacing; and
  corrected the mobile AI privacy notice.
- Added Expo USB development command, a configurable mobile API URL and
  provisional EAS build profiles and app identifiers.
- Added read-only schema inspection and migration safety guidance. No remote
  database changes were made.
- Removed an exposed Gemini key from templates and documentation. Rotate the
  exposed key; deleting local copies does not revoke it.
