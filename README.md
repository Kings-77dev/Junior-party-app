# Midnight Reserve

A mobile-first party reservation app with a public guest flow and a separately
protected organizer dashboard. It runs on Cloudflare Workers with D1 for orders
and inventory and R2 for payment screenshots.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

## Organizer authentication

The organizer Worker is protected by Cloudflare Access. Access sends a one-time
code only to `samueladjei162@gmail.com` and injects the verified
`cf-access-authenticated-user-email` header. Organizer-only APIs live under
`/api/organizer/`; the public QR flow uses `/api/state` and cannot perform admin
actions.

## Useful Commands

- `npm run dev`: start local development
- `npm run build`: verify the vinext build output
- `npm test`: build and run the product regression suite
- `npm run db:generate`: generate Drizzle migrations after schema changes
- `npm run cf:check`: build and validate the Cloudflare staging bundle
- `npm run cf:db:migrate`: apply D1 migrations to staging

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
