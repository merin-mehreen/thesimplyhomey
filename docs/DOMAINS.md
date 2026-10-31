# Test and production domains

| Purpose | Website | Owner sign-in |
| --- | --- | --- |
| Current test address | https://homey.economicsystems.cc | https://homey.economicsystems.cc/admin |
| Final production address | https://thesimplyhomey.com | https://thesimplyhomey.com/admin |

The application uses relative paths for API calls, shopping pages, payment uploads and admin. Nothing redirects customers to a hardcoded hostname. The temporary test hostname sends a noindex header so it does not compete with the production store in search results; the production storefront remains indexable. Admin cookies are host-only and require HTTPS, so sign in separately on each domain. Do not set a cookie Domain value trying to cover two unrelated parent domains.

## Use one Worker with both domain names

For the simplest setup, attach both addresses to the same Worker that contains the DB binding and your ADMIN_PASSWORD and SESSION_SECRET secrets. They then share the same catalogue, orders, inventory and admin configuration. Moving from the test address to the final address does not require a new database or another set of secrets when the Worker stays the same.

In Cloudflare, open **Workers & Pages → your existing store Worker → Settings → Domains & Routes → Add → Custom Domain**. Add `homey.economicsystems.cc` for current testing. When the final domain is ready, add `thesimplyhomey.com` to that same Worker. Both parent zones must be active in that Cloudflare account. Resolve any existing conflicting DNS record or Worker assignment deliberately in the dashboard; do not delete unrelated DNS entries.

The repository's default deploy does not claim a future production domain automatically. You can manage domains in Cloudflare, or explicitly put them in Wrangler using:

```bash
npm run domains:test
```

This updates only `wrangler.jsonc`, declaring the current test hostname as a Custom Domain. Commit the change and deploy. To attach both when ready:

```bash
npm run domains:both
```

To declare only the final hostname later:

```bash
npm run domains:production
```

These commands do not change DNS or your account by themselves. A subsequent Wrangler deployment applies the selected configuration. The helper preserves routes unrelated to these two managed hostnames. Switching from both to production-only can remove the test Custom Domain on the next deploy; do that deliberately when finished testing.

If your Worker already has another name, retain that Worker and match the Wrangler `name` to it. Do not create another Worker accidentally and then configure secrets on the old one. Keep the existing database binding to preserve your data.

## Login diagnosis on the actual hostname

Open `/api/status` on the same hostname where sign-in is failing. The current response includes:

- `hostname`: the address actually serving the request.
- `release`: identifies the updated EasyPaisa/ledger code.
- `database`: whether a DB binding is attached.
- `adminConfigured`: whether both runtime secrets pass length checks.
- `issue`: A01 (password binding), A02 (session binding), A03 (database binding), or null.

These fields contain no secret values. If the response shows HTML or a 404 rather than JSON, that hostname is not routing `/api/` to this Worker. If it still displays an older generic admin-setup error, check which deployment/version serves that hostname. An A04 login response means database initialization failed; inspect the private Worker logs.

Cloudflare dashboard secrets belong to a Worker/environment, not to a domain name or the GitHub repository. Verify them on the exact Worker serving `homey.economicsystems.cc`. Deploy saved secret changes. The same rule applies to the final domain if you use a different Worker for production.

## Separate staging data, if needed later

One Worker means shared data: test orders affect the same stock and ledgers as production orders. For isolated testing after launch, deploy the same code as a separate staging Worker with its own D1 database, evidence storage and secrets. Attach the test hostname to that Worker and the final hostname to production. Configure each environment independently; do not accidentally share the production database with staging.
