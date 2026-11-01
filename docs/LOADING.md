# Troubleshooting a stalled storefront

If the page stays on “Opening homéy…” and Chrome Network shows `/api/catalog` as pending, the HTML and JavaScript have loaded but the storefront is still waiting for its catalogue API. A blocked Cloudflare Insights beacon is a separate analytics request; it is not needed for the catalogue or checkout.

The `homey-catalog-reliability-v2` release removes shared in-flight database initialization promises. An unfinished operation belongs to its originating Worker request, so a later page load must perform its own check rather than inherit work from a cancelled navigation. Only a completed schema check is remembered. Existing databases use a single read to check migration markers, and the four catalogue reads use one D1 batch.

Catalogue loading has an eight-second server deadline. The browser gives each request ten seconds, including reading its response body, and retries a temporary failure once. Persistent failures show a retry button instead of leaving the opening message indefinitely. Failed requests do not serve bundled prices or inventory as a substitute for the live store.

## Verify the deployed version

Open `/api/status` on each domain. Its `release` should be `homey-catalog-reliability-v2`. This endpoint checks bindings without waiting for database initialization. The `database` flag indicates that the binding exists, not that a live database query has succeeded.

Both Workers need to deploy the new GitHub commit. Sharing a repository does not automatically synchronize their deployment versions or database bindings. Admin secrets are not required for public browsing.

## If the catalogue still fails

- Open `/api/catalog` directly and note the response code. `C01` means the server deadline was reached; `C02` means database setup or catalogue reading failed.
- For successful requests, the `Server-Timing` header separates database setup from catalogue reading. `X-Homey-Release` identifies the running code.
- In the affected Worker's logs, look for `Catalogue request failed`. The log includes the failure stage and Cloudflare request Ray ID without exposing credentials or customer data.
- Check that the affected Worker's `DB` binding points to its intended D1 database. Inspect Worker exceptions and D1 errors or limits in that account. Do not recreate or overwrite a database to troubleshoot this.
- If the new browser code times out but the server returns neither JSON nor a catalogue error, inspect Cloudflare routing and security events for that hostname. Preserve the failing request's Ray ID for diagnosis.
