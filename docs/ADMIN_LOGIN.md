# Owner-only admin login troubleshooting

The public login screen intentionally contains only a logo, password field and sign-in button. No owner instructions or admin links appear in the storefront.

Your Cloudflare screenshot uses the correct names: ADMIN_PASSWORD and SESSION_SECRET. Encrypted entries in the dashboard confirm that values were entered, but they do not reveal their lengths or prove that the browser is reaching the deployed Worker/environment containing them.

## Check the address first

- A `workers.dev` or your custom-domain address runs on Cloudflare. Use the secrets attached to that exact Worker and active environment.
- `localhost`, `127.0.0.1` or a local development address runs on your computer. Cloudflare dashboard secrets do not automatically become local secrets. Set ADMIN_PASSWORD and SESSION_SECRET in the ignored `.dev.vars` file in the local repository and restart `npm run dev`.

The password must contain at least 16 characters and the separate session secret at least 32. Numeric strings of those lengths are accepted. Neither secret should be shared in chat or committed to GitHub. The application trims accidental leading/trailing whitespace from configured secrets and the entered password.

## Error codes

| Code / message | Meaning | Owner action |
| --- | --- | --- |
| A01 | ADMIN_PASSWORD is missing from the running environment or shorter than 16 characters. | Check the exact Worker/environment and deploy the saved secret changes. |
| A02 | SESSION_SECRET is missing from the running environment or shorter than 32 characters. | Check the independent session secret and deploy the saved changes. |
| A03 | The running Worker has no D1 binding named DB. | Open the Worker's Bindings, attach the existing catalogue database as DB, and redeploy. Keep the same database to preserve data. |
| A04 | The database binding exists but schema initialization failed. | Inspect the Worker's runtime logs for “Database initialization failed”; fix its database permissions/binding or send the error message for diagnosis. |
| Incorrect password | Required bindings are present but the entered password differs. | Use the ADMIN_PASSWORD for this deployment; SESSION_SECRET is not the sign-in password. |
| Too many attempts | Five failed sign-ins occurred from this IP within 15 minutes. | Wait for the cooldown before retrying with the correct password. |

The application logs only binding presence and validation results for configuration errors, not secret values. `/api/status` can be opened manually to see `database`, `adminConfigured` and an issue code; it does not return credentials.

In Cloudflare, use **Workers & Pages → the Worker serving your website → Settings → Variables and Secrets**. After adding or editing secrets, deploy the changes. Check that the production deployment, rather than an older version or a separate preview Worker, serves the address you are opening. A Cloudflare redeploy does not update a local checkout.

For secure cookie handling, use HTTPS on the deployed site. During local development use `localhost` rather than a custom plain-HTTP hostname. Once signed in, the cookie is HttpOnly and expires after eight hours.
