# homéy · Simply Home.

A Cloudflare Workers storefront with a protected administration area. Homéy home collections and Raya atelier share one store, with separate page palettes.

## Run locally

Use Node 24:

```bash
npm ci
npm run dev
```

Open Wrangler's printed URL. The schema and initial catalogue are created automatically. Admin is at `/admin`; see [setup and login](docs/CLOUDFLARE.md) for the two private secrets you choose yourself. A direct static HTML/file server cannot run this application's API.

## Deploy

Connect this repository to **Cloudflare Workers**. Root: repository root. Build: `npm run build`. Deploy: `npx wrangler deploy`. Worker name: `homey-store` (or update Wrangler's name to match your existing Worker). D1 is provisioned automatically; there are no placeholder IDs to replace. The asset build also runs automatically when Wrangler deploys.

Full instructions: [Cloudflare setup](docs/CLOUDFLARE.md), [Store management](docs/ADMIN.md), [Backup and recovery](docs/BACKUPS.md).

## Included

- One-row navigation: logo left; collections, story and Raya logo in the centre; search and shopping bag right. Responsive mobile menu.
- 7 bed-linen designs, 22 towel designs and all 83 home catalogue photos.
- Product galleries, size/colour/type variants, prices, discounts, search and saved shopping bag.
- Actual cash-on-delivery checkout with server-side price/stock checks, persistent orders, stock deduction and order references. No demo checkout or preview banners.
- Admin product/category management, global contacts/content/policies, inventory, order status and catalogue export.
- Cloudflare D1 for persistent records. New file uploads use optional R2; original photos and HTTPS image URLs work without R2.
- Signed HttpOnly sessions, login throttling, same-origin writes, transactional inventory checks and protection against stale admin edits.
- Raya's placeholder listing stays private until actual jewellery images/details are ready.

## Business values

Prices, dimensions and inventory from the earlier authorized setup remain provisional. They are now displayed in the normal storefront layout; confirm them before accepting public orders. Enter real contact/social information and review policies in the admin. No customer-service phone number or social account is fabricated.

## Checks

```bash
npm test
npm run build
npx wrangler deploy --dry-run
```

## Files

- `public/`: storefront and admin HTML/CSS/JS; initial catalogue JSON.
- `Images/`: original photos and logos.
- `worker/`: server API, authentication, database initialization and validation.
- `migrations/`: versioned SQL schema and integrity triggers.
- `scripts/`: build, import and optional R2 setup.
- `tests/`: API, stock, initialization and upgrade tests.
- `docs/`: deployment, everyday administration and backup instructions.
- `wrangler.jsonc`: Worker entry point, automatic build and database binding.

Frontend deployments preserve stored catalogue edits and orders. Do not regenerate the import as a way to edit the live store; use the admin. Keep the same D1 database attached between deployments.

## Operating limits

Cash on delivery is implemented. Card payments, automated emails, courier booking, taxes, customer accounts and automatic refund/restock flows are not. Cancelling an order requires a deliberate stock adjustment by the owner. Admin lists the first 500 recent orders and 1,000 uploaded images. Stale product forms are rejected if stock or product data changed while you were editing. Catalogue JSON exports exclude orders and image bytes; keep full database/media backups separately.
