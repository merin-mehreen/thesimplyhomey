# Deploy on Cloudflare Workers

The Worker serves static files and the API from the same hostname. D1 persists product/settings/order data between deployments. R2 stores uploads. GitHub contains source and the initial catalogue, not live customer orders or admin passwords.

## One-time account setup

Run these commands in a trusted terminal from this repository. Use your own Cloudflare account; do not share your password or API token in chat or commit it to GitHub.

```bash
npm ci
npx wrangler login
npx wrangler d1 create homey-store
npx wrangler r2 bucket create homey-media
```

Copy the D1 database ID printed by the create command into the `database_id` field in `wrangler.jsonc`. Keep the bindings named `DB`, `MEDIA` and `ASSETS`. R2 may require enabling billing in your Cloudflare account; check your account's current plan and charges.

Configure two independent secrets. Wrangler will prompt for their values:

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put SESSION_SECRET
```

Use a strong unique admin password of at least 16 characters, and an independent randomly generated session secret of at least 32 characters. The admin refuses login without both. Changing `SESSION_SECRET` signs out existing admin sessions. Session cookies expire after eight hours; five failed logins from an IP within 15 minutes temporarily block that IP.

If Wrangler requires a Worker to exist before secrets can be set, deploy once with checkout off, set both secrets, then deploy again. The admin remains locked while secrets are absent.

Initialize storage and deploy:

```bash
npm run db:remote
npm run seed:remote
npm test
npm run deploy
```

Open the returned `workers.dev` URL and `/admin`. Initial seeding uses `INSERT OR IGNORE`: subsequent frontend deployments and repeated seed imports preserve existing database edits. Migrations are applied separately and must run when new migrations are introduced.

## GitHub automatic deployments

In Cloudflare, create a Worker project connected to `abdullah2711/temp`, branch `main`. Configure:

- Root directory: repository root.
- Build command: `npm ci && npm run build && npm test`.
- Deploy command: `npx wrangler deploy`.
- D1: existing `homey-store`, binding `DB`.
- R2: existing `homey-media`, binding `MEDIA`.
- Secrets: `ADMIN_PASSWORD`, `SESSION_SECRET`.

The database ID in the checked-in Wrangler configuration must match your account. The initial remote migrations and seed import remain one-time terminal actions, not automatic per-build imports. Cloudflare build authentication belongs in Cloudflare's configuration, never in the source files.

Attach the purchased domain through your Worker's custom-domain settings after the preview has been reviewed. Keep frontend and `/api/` on the same hostname so signed admin cookies and same-origin checks work.

## Pre-opening checklist

1. Sign in to `/admin` and set email, WhatsApp, Instagram and Facebook.
2. Confirm product names, images, fabric, measurements, set contents, colours and sizes.
3. Enter prices and stock; enter original prices only when an actual discount applies.
4. Replace Raya placeholder photos and uncheck placeholder before publishing jewellery.
5. Replace all provisional policy text with your real delivery, returns, terms and privacy policies.
6. Confirm delivery charges, currency and that cash-on-delivery is appropriate for your service area.
7. Enable checkout, place a controlled test order and confirm it appears in the admin with correct stock and totals.
8. Verify mobile browsing, contact links and fulfilment steps before advertising the store.

Checkout does not process card payments. Do not collect card details via product forms, WhatsApp or email. A payment provider can be added later using server-created payment sessions and verified webhooks.

## Backups and recovery

Use `/admin` → Backup for a catalogue JSON export. It excludes customer orders and image bytes. Use Cloudflare's D1 export/backup features for the full database, and a separate backup of R2 media. Keep access to those backups private.

The read-only JSON fallback is for unconfigured previews only. Public `/api/catalog` strips drafts and placeholder products. Once `DB` is bound, the database is authoritative; a missing/uninitialized database returns a setup error instead of pretending an edit was saved.
