# Deploy homéy on Cloudflare Workers

## What was corrected

The first configuration contained a placeholder D1 database ID and a mandatory named R2 bucket. Neither could be used on another account without manual setup. The current configuration uses Wrangler's automatic D1 provisioning, runs the asset build automatically, and initializes the database schema and catalogue on the first API request. R2 is optional so an account without R2 enabled can still deploy the store and accept cash-on-delivery orders.

Cloudflare’s built-in HTML redirects are disabled because this Worker handles `/admin` and storefront routes itself. This prevents `/admin.html` and `/index.html` rewrites from redirecting back to their public route.

## GitHub deployment settings

In Cloudflare, open **Workers & Pages**, create/import a **Worker** from GitHub, and select `abdullah2711/temp` with production branch `main`.

| Setting | Value |
| --- | --- |
| Root directory | Repository root (leave blank, or `/` if required) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Worker name | `homey-store` (matching `wrangler.jsonc`) |
| Node version | `24` (`.node-version` is included; set `NODE_VERSION=24` if necessary) |

Use the Worker deployment flow: uploading `dist/` as static files alone would omit the API, admin and order persistence. Wrangler invokes the asset build even if no separate build command has been entered. No database ID needs to be copied into the repository for a new installation. Wrangler provisions and links the `DB` binding; its token/account permissions must permit Worker and D1 creation.

If reusing a Cloudflare Worker with another name, set the `name` in `wrangler.jsonc` to that exact name before connecting it. Keep the existing `DB` binding linked to the same D1 database across later deployments. For an already configured account, you may supply its actual database ID to pin it explicitly. Do not replace a live database with a new empty one.

After deployment, open the returned `workers.dev` URL. The first catalogue request creates the schema and imports the catalogue once. Reloading or rebuilding does not reset products, prices, stock, settings or orders. Earlier demo installations are upgraded once: demo-only wording is removed and cash-on-delivery checkout is enabled, preserving stored prices and stock.

## Sign in to the admin

Admin is your exact storefront origin plus `/admin`. There is also a **Store management** link at the bottom of the footer.

1. In Cloudflare, open **Workers & Pages → your Worker → Settings → Variables and Secrets**.
2. Add **ADMIN_PASSWORD** as a secret: choose a strong unique password with at least 16 characters.
3. Add **SESSION_SECRET** as a separate secret: use at least 32 random characters from a password manager.
4. Save/deploy the changes if Cloudflare prompts you to do so.
5. Visit `/admin` and sign in with the `ADMIN_PASSWORD` you chose.

There is no default password and no password belongs in GitHub. Sessions expire after eight hours. Changing `SESSION_SECRET` invalidates existing sessions. Five failed login attempts per IP within 15 minutes temporarily block login from that IP.

`/api/status` reports whether database and admin secrets are configured, without exposing their values. Missing secrets leave the admin locked; public catalogue browsing does not require them.

## Enable image uploads (optional)

The 83 original catalogue photos ship with the website and work immediately. Existing images can be selected in **Admin → Media**, and product/category fields also accept HTTPS image URLs.

To upload new image files directly from the admin:

1. Enable R2 in your Cloudflare account if needed.
2. From a trusted checkout run `npm run storage:enable`. This adds an R2 `MEDIA` binding to `wrangler.jsonc` without any account-specific bucket name.
3. Commit that configuration and redeploy. Wrangler provisions the bucket and links it to `MEDIA`.

If you already have a bucket, put its real `bucket_name` into that R2 binding instead. Store uploaded photos and database backups separately. Do not commit R2 credentials.

## Local development

Install Node 24, open a terminal in the downloaded repository and run:

```bash
npm ci
npm run dev
```

Wrangler prints the address. Open it in a browser; the local database and catalogue initialize automatically. You do not need to run migration or seed commands for a new checkout. Opening `index.html` directly cannot run the server API.

To sign in locally, create an ignored `.dev.vars` file in the repository root:

```text
ADMIN_PASSWORD="your-own-strong-password-at-least-16-characters"
SESSION_SECRET="your-own-independent-random-secret-at-least-32-characters"
```

Use your own values, then restart `npm run dev`. Visit the same address with `/admin` appended. The file must never be uploaded to GitHub. If a local browser rejects a Secure cookie on a custom HTTP hostname, use the localhost address printed by Wrangler; production uses HTTPS.

## If deployment still fails

Open the failed deployment in Cloudflare and copy the error section from its build log. The GitHub connection does not expose private Cloudflare build logs here, so account-specific errors require that log.

| Error | Check |
| --- | --- |
| Missing entry point / Wrangler configuration | Root directory must contain `wrangler.jsonc` and `worker/index.js`. |
| Worker name mismatch | Dashboard Worker name and `wrangler.jsonc` name must match. |
| D1 permission / provisioning error | Build token must allow D1 creation and access in the selected account. |
| R2 account not enabled | Default setup has no R2 requirement. If you added `MEDIA`, enable R2 or remove that optional binding. |
| `dist` does not exist | Ensure the current Wrangler config is used; its custom build creates `dist`. |
| `node:sqlite` during tests | Use Node 24 for test/build commands. |
| API routes show HTML / 404 | Deploy through Workers with the Worker entry point; a static upload cannot run checkout. |

## Before accepting public orders

The code now uses an actual cash-on-delivery flow, not a demo. Existing provisional prices, sizes and stock remain the values authorized for setup. Confirm those business values, enter real contact/social details, and review the generic policy text before inviting customers. This source update does not configure a payment gateway, send customer emails, or book couriers. Orders appear in the protected admin for you to fulfil.

For backups, see [Backup and recovery](BACKUPS.md). D1 and R2 data are separate from the GitHub source.
