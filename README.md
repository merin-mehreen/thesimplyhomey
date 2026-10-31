# homéy · Simply Home.

A Cloudflare Workers storefront and password-protected management area, with Raya atelier inside the same store. Built with HTML, CSS and JavaScript; product data lives in D1 and uploaded images in R2.

## What is included

- Responsive storefront, collection pages, product galleries, search, local shopping bag and cash-on-delivery checkout.
- Separate homéy and Raya page palettes; supplied brand logos in the navigation.
- 7 bed-linen designs and 22 towel designs, grouped exactly as the supplied catalogue folders. Every original catalogue photo is included in its product gallery.
- A private Raya draft with a clearly flagged temporary image. No jewellery listings are published until actual photos and details are ready.
- `/admin`: products, categories, images, variants, prices, discount display, stock, order status, global contact details, homepage content, policies and catalogue export.
- Shared settings update the footer and contact links throughout the store.
- Draft/unpublish controls, login throttling, signed HttpOnly sessions, same-origin mutation checks, server-side validation and atomic inventory/order writes.

## Before launch

The source is ready to configure on Cloudflare. A GitHub push alone does **not** create D1/R2 or deploy a live store.

Real prices, measurements, fabric composition, set contents, contact details and commercial policies have not been supplied. The imported products now have clearly labelled sample prices, variants and stock in preview mode. Product names are editable working titles. Real checkout starts **off**; preview mode offers a demo checkout without collecting personal details or creating orders. Finalise factual product descriptions and delivery/returns/privacy/terms content before opening ordering. No card-payment provider is connected.

## Quick setup

See [Backup and recovery](docs/BACKUPS.md), [Cloudflare setup](docs/CLOUDFLARE.md) for deployment and [Store management](docs/ADMIN.md) for everyday editing.

```bash
npm ci
npm run build
npm test
```

For local development, create `.dev.vars` with a private `ADMIN_PASSWORD` (at least 16 characters) and `SESSION_SECRET` (at least 32 random characters). Never commit that file.

```bash
npm run db:local
npm run seed:local
npm run dev
```

Open the URL Wrangler prints. Admin is at `/admin` on the same origin. Cloudflare local development emulates D1 and R2; changes are stored under the ignored `.wrangler/` directory.

## Repository layout

```
Images/                 Original catalogue and brand artwork
public/                 Storefront and admin HTML/CSS/JavaScript
public/assets/          Sized, transparent logo assets
public/data/catalog.json Initial import / read-only fallback
worker/                 API, authentication, validation, orders and media
migrations/             D1 schema and order integrity trigger
scripts/                Build and one-time import scripts
seed.sql                Initial database import (does not overwrite existing rows)
tests/                  API, validation, inventory and persistence tests
docs/                   Setup and management guides
wrangler.jsonc          Cloudflare Worker, D1, R2 and asset bindings
```

`npm run build` packages public files plus the original `Images/` into ignored `dist/`. Keep product edits in the admin after initial import; rebuilding the frontend does not overwrite D1 data. Do not re-run `scripts/seed.mjs` as a way to update the live catalogue. It regenerates only the initial import files.

## Scope and operating notes

This is a focused custom store, not full Shopify parity. Payment processing, automated emails, courier integration, tax calculation, customer accounts and automatic refund/restock flows are not included. Orders are recorded in the admin; arrange fulfilment directly with customers. Order cancellation does not automatically restock. The first 500 recent orders and first 1,000 R2 uploads are listed in the management interface. Add pagination as volume grows.

Stock changes during checkout are transactional. Stale product forms are rejected if the product or its stock changes while you edit. Reopen the product to load current values before saving again. Categories can be hidden without deleting their products. Download catalogue exports and maintain separate D1 and R2 backups.

The policy text is provisional operational copy and must be replaced with your actual business policies. No contact information or product prices are fabricated.
