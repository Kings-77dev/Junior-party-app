# Payment screenshot upload-size fix

## Symptom

A customer could attach a 1.5 MB screenshot, but submitting the payment remained on the form with no visible error. The network request returned HTTP 413.

## Root cause

The hosting layer rejected the multipart request before the application route's existing size check ran. The client uploaded the original image and attempted to parse the failed response without checking its status, so the rejection was silent.

## Fix

- Accept customer image selections up to 10 MB.
- Compress images larger than 850 KB in the browser before upload.
- Check upload responses and show a clear customer-facing error.
- Disable and relabel the submit button while processing.
- Keep a 10 MB defensive limit in the upload route.

## Evidence

The original 1.5 MB upload reproduced HTTP 413. The new regression test covers the 10 MB selection limit, compression path, upload-status handling, and processing state. The full build and three-test suite pass.

## Regression test

`tests/payment-flow.regression-1.test.mjs`

## Status

Implementation verified locally. Production browser re-verification remains pending deployment.
