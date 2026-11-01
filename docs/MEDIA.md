# Product image uploads

The website uses a native R2 binding named `MEDIA`. The repository is shared by Workers in different Cloudflare accounts, so it declares the binding without pinning a bucket name or account ID:

```json
"r2_buckets": [
  { "binding": "MEDIA" }
]
```

Wrangler 4.156.0 inherits an existing `MEDIA` binding on the target Worker. If there is no existing connection, its automatic provisioning creates a bucket in the current deployment account and connects it. Later deployments reuse that connection. This does not delete or migrate existing buckets or their objects.

## Deploy the connection

1. Enable R2 in the same Cloudflare account as the Worker serving the affected domain. The deployment token must be able to create/bind R2 resources there.
2. Deploy the latest GitHub `main` commit to that Worker. The shared configuration allows each Worker to retain its own storage connection.
3. Refresh `/admin`, then open **Media** or edit a product. Upload a JPEG, PNG or WebP up to 10 MB. Save the product after attaching its new image URL.

## Use an existing bucket such as `homey`

Open **Workers & Pages → the correct Worker → Bindings → Add binding → R2 bucket**. Use variable name `MEDIA`, select the existing bucket in that same account, and save/deploy. Subsequent GitHub deployments inherit the connection because the repository does not override its bucket name.

Creating a bucket alone does not attach it to a Worker. The S3 endpoint ending in `.r2.cloudflarestorage.com/homey` identifies a bucket in the account named in that endpoint. It cannot supply a native binding to a Worker deployed under another account ID. Do not paste the S3 endpoint into website settings or commit access keys.

Each website Worker needs its own `MEDIA` binding. Workers in the same account can share a bucket if intended; Workers in different accounts must each use storage in their own account. The buckets do not need matching names. Keep the buckets private: the Worker serves catalogue objects through `/media/uploads/...`, so a public R2 development URL, custom bucket domain or CORS policy is unnecessary.

## Error 10085: bucket not found

Compare the deployment account ID in the failed `/accounts/.../workers/scripts/.../versions` API request with the account ID at the beginning of the bucket's S3 endpoint. If those differ, the Worker cannot find that bucket in its own account.

The shared configuration no longer pins `bucket_name: "homey"`. Deploy the corrected commit to inherit/provision storage separately for each Worker. If an account reports that R2 is not enabled, activate R2 in that deployment account. If provisioning reports a permissions error, update the build token's R2 access there. Do not replace the existing D1 database, delete buckets, or move uploaded files to resolve a binding mismatch.

## Check the connection

While signed into `/admin`, open `/api/admin/status` on that same domain. `"media": true` means the running Worker has received the binding. The **Media** panel refreshes this status when opened. A successful upload and image preview verify actual bucket access.

## Why payment screenshots already work

Product photos use `MEDIA`. Payment evidence uses a separate storage path: private D1 database storage by default, up to 1 MB per screenshot. Connecting product storage does not move payment screenshots or make them public. A separate private bucket bound as `PAYMENTS` can optionally store new payment screenshots up to 5 MB. Original catalogue photos continue to ship with the website.
