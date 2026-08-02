# Product backlog

## Final production domain and invitation QR

Status: Backlog

Move the approved staging release to the final public address and generate the single invitation QR code only after the final domain is active.

Acceptance criteria:

- The final guest domain is agreed, registered, and attached to the guest Cloudflare Worker with HTTPS enabled.
- The organizer dashboard remains on a separate protected address and is never linked from the guest experience.
- All production links, metadata, WhatsApp messages, and redirects use the final guest domain.
- One high-resolution QR code is generated for the guest landing page, with SVG for print and PNG for sharing.
- The QR is scanned successfully from both iPhone and Android devices and opens the guest landing page without authentication.
- The final guest ordering and organizer verification flows pass a production smoke test before the QR is printed.

Candidate guest domain: `mcvyral-reserve.party` (confirm ownership and spelling before purchase or DNS changes).

Out of scope: individual guest QR codes, automatic payment verification, and changes to the organizer login model.
