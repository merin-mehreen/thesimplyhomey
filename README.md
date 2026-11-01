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

Connect this repository to **Cloudflare Workers**. Root: repository root. Build: `npm run build`. Deploy: `npx wrangler deploy`. Worker name: `temp`, matching the existing Worker in this Cloudflare account. D1 is provisioned automatically; there are no placeholder IDs to replace. The asset build also runs automatically when Wrangler deploys.

Full instructions: [Payment flow and ledgers](docs/PAYMENTS_AND_LEDGERS.md), [Login troubleshooting](docs/ADMIN_LOGIN.md), [Cloudflare setup](docs/CLOUDFLARE.md), [Store management](docs/ADMIN.md), [Backup and recovery](docs/BACKUPS.md).

## Included

- One-row navigation: logo left; collections, story and Raya logo in the centre; search and shopping bag right. Responsive mobile menu.
- 7 bed-linen designs, 22 towel designs and all 83 home catalogue photos.
- Product galleries, size/colour/type variants, prices, discounts, search and saved shopping bag.
- Dedicated cart, checkout and payment pages. Manual EasyPaisa transfer, private screenshot submission and owner payment approval. No cash on delivery.
- Admin product/category management, brand logos, homepage copy/photos, contacts/policies, EasyPaisa details, evidence review, order status, sales ledger and inventory ledger with filters and CSV exports.
- Cloudflare D1 for persistent records. Payment screenshots default to private D1 storage (1 MB). Optional private PAYMENTS R2 supports 5 MB. Catalogue uploads use a per-Worker R2 bucket bound as `MEDIA` (existing bindings are inherited; otherwise Wrangler provisions a bucket in the deployment account); original photos and HTTPS image URLs also remain available. See [media setup](docs/MEDIA.md).
- Signed HttpOnly sessions, login throttling, same-origin writes, transactional inventory checks and protection against stale admin edits.
- Raya's placeholder listing stays private until actual jewellery images/details are ready.

## Business values

Prices, dimensions and inventory from the earlier authorized setup remain provisional. They are now displayed in the normal storefront layout; confirm them before accepting public orders. Enter real contact/social information and review policies in the admin. No customer-service phone number, social account or payment recipient is fabricated. Enter your actual EasyPaisa recipient in Store settings before collecting payments.

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

Manual EasyPaisa transfer and evidence review are implemented. There is no gateway integration, card processing, automated email, courier booking, tax engine or automated refund. Stock is reserved on placement; unpaid cancellation releases it exactly once. Unpaid orders do not automatically expire. Ledgers are paginated and filtered CSV exports allow up to 10,000 rows. The media picker lists up to 1,000 uploads. Stale product forms are rejected if stock or product data changed while you were editing. Catalogue JSON exports exclude orders and image bytes; keep full database/media backups separately.

## Your domains

The same application supports `homey.economicsystems.cc` for testing and `thesimplyhomey.com` for production. See [domain setup](docs/DOMAINS.md). Optional `domains:test`, `domains:production` and `domains:both` scripts prepare explicit Custom Domain entries when you are ready to deploy them.
