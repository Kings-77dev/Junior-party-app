# Live Mobile Money configuration upgrade

## Symptom

The public app displayed empty or placeholder payment details even though the correct MTN Mobile Money number existed in the current source.

## Root cause

The live D1 database contained an older saved version of the event configuration. The application correctly preferred saved settings over defaults, but there was no versioned upgrade path, so the old `Add before launch` payment destinations and empty WhatsApp value survived later deployments.

## Fix

Incremented the configuration version and added a one-time database configuration upgrade. Version 1 saved configurations are upgraded with the launch payment destinations and WhatsApp number while preserving package, inventory, and other event state.

## Evidence

The live API reproduced the stale values before the fix. The full project build and regression suite pass with assertions covering the version upgrade and launch-field migration.

## Regression test

`tests/rendered-html.test.mjs` requires configuration version 2 and the saved-config upgrade logic for Mobile Money and WhatsApp fields.

## Status

DONE. Production version 12 is live, and a fresh public API read reports configuration version 2, MTN MoMo `0538044116`, account name `Samuel Adjei`, WhatsApp `0557788343`, and the other networks disabled.
