# Organizer authentication return-route fix

## Symptom

Opening the organizer entrance and signing in redirected the organizer to the customer reservation flow.

## Root cause

The organizer sign-in button passed `/` as the authentication return route. The authentication service therefore returned successful organizer sign-ins to the guest homepage.

## Fix

Changed the organizer sign-in return route to `/organizer` while retaining the existing organizer-only email authorization.

## Regression coverage

The rendered-source test now requires the organizer sign-in URL to use `/organizer` and rejects the previous guest-root return route.

## Status

Fixed. Full test result and deployment status are recorded in the corresponding development run.
