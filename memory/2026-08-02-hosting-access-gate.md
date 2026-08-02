# Hosting access gate blocks organizer login

## Symptom

After attempting to sign in at `/organizer`, the visitor returns to a page titled "Sign in required" instead of seeing the organizer dashboard.

## Root cause

The Sites project uses `custom` access with only the project owner allowed. The hosting platform therefore intercepts every route, including `/organizer`, before the application and its approved-organizer check can run.

## Evidence

- The live `/organizer` browser tab is titled "Sign in required".
- The Sites project reports `access_mode: custom`, one owner in `allowed_users`, and no other users or groups.
- The organizer dashboard route and management interface are present in the deployed source.

## Resolution

Changed the Sites project to public access so QR guests can enter without an account. The application-level sign-in and approved-email check continue to protect `/organizer`.

## Status

DONE. Production access reports `public`, the site reports `active`, and version 10 remains live.
