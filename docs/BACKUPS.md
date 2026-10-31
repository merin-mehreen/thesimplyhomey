# Backing up the whole store

A complete Cloudflare store backup has several parts. A screenshot records appearance only. A Worker rollback restores code/configuration within supported limits; it does not restore your D1 product/order data or R2 photos. Keep dated copies of each part together and record the Git commit and deployed Worker version.

## 1. Website code and original catalogue photos

Open the GitHub repository, choose the deployed commit (or a release/tag created for it), then use **Code → Download ZIP**. Downloading the current main branch is a backup of current source; it matches the live deployment only if that exact commit was deployed. Original supplied photos are in `Images/`. Photos subsequently uploaded through the admin are in R2, not GitHub.

For a developer using Git, a full repository backup including available branches and tags can be made with:

```bash
git clone --mirror https://github.com/abdullah2711/temp.git homey-repository.git
```

Copy this backup to your own protected storage. A normal source ZIP does not contain Git history.

## 2. Quick catalogue export

Once deployed, visit **/admin → Backup → Download catalogue JSON**. This contains products, variant stock, categories and store settings. It does not contain customer orders or image file bytes, and is not a complete disaster-recovery backup. The interface currently exports JSON only; restoration requires a developer/import process.

## 3. Complete D1 database backup

In a trusted terminal with Cloudflare access, run from the repository:

```bash
npx wrangler d1 export YOUR_ACTUAL_DATABASE_NAME --remote --output=homey-database.sql
```

Replace YOUR_ACTUAL_DATABASE_NAME with the database name shown under your Worker’s DB binding in Cloudflare. Automatic provisioning may give it a different name from the Worker. This exports schema and records, including products, stock, settings and customer orders. Treat the file as private customer data. For an exact point-in-time manual backup, briefly pause real checkout and staff catalogue changes, take the export and media copy, then reopen ordering. Take database backups before schema changes too.

After exporting, test recovery on a separate database before relying on the backup. Keep the migration files with it so the expected schema and triggers can be verified.

## 4. Uploaded image backup from R2

If you enabled uploads, open Cloudflare **R2** and choose the bucket linked as your Worker’s **MEDIA** binding. Individual objects can be downloaded there. For a full bucket copy, a developer can configure `rclone` using Cloudflare's R2 documentation, then run:

```bash
rclone copy homey-r2:homey-media ./homey-media-backup --progress
```

`homey-r2` is the locally configured rclone remote name, not a built-in command or secret. Use `copy` to download files; the command above does not remove source files. Store the downloaded folder alongside the database backup. Keep original object paths such as `uploads/...`; product image URLs depend on those paths. Configure R2 credentials on your own computer, not in this public repository.

## 5. Configuration and secrets

The repository contains `wrangler.jsonc`. Record your actual database ID, bucket name, custom domain, relevant DNS configuration and deployed version/commit. Store passwords and session secrets separately in a password manager; they must never go into the public repository or an unprotected source ZIP. New secrets can be set during recovery; a new session secret signs all admins out.

## Restoring safely

1. Restore the chosen Git commit to a working checkout and install dependencies with `npm ci`.
2. Create a separate D1 database and R2 bucket for a recovery test.
3. Import the database export into the empty recovery database. Whether migrations should be applied first depends on whether the export contains schema; do not blindly apply migrations twice. Ensure both order-integrity and stock-revision triggers exist after import.
4. Copy media back with the original paths. Set the recovery bindings and private secrets.
5. Build and deploy the recovery Worker on a test hostname.
6. Check products, photos, admin sign-in, stock and a controlled test order before switching the production domain.

For code-only mistakes, Cloudflare Workers supports deployment rollbacks, but those are not a replacement for database and media backups.

## Official references

- D1 export: https://developers.cloudflare.com/d1/best-practices/import-export-data/
- R2 with rclone: https://developers.cloudflare.com/r2/examples/rclone/
- Worker rollbacks: https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/
