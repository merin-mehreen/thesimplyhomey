# Product image uploads

The owner-created R2 bucket is named `homey`. The repository's `wrangler.jsonc` connects it to the Worker as:

```json
"r2_buckets": [
  { "binding": "MEDIA", "bucket_name": "homey" }
]
```

The S3 endpoint ending in `.r2.cloudflarestorage.com/homey` identifies the bucket, but it does not itself connect a bucket to a Worker. No S3 URL, access key or secret is needed in the website's settings. The native Worker binding provides access.

## Deploy the connection

1. Confirm the `homey` bucket exists in the same Cloudflare account as the Worker serving the affected domain.
2. Deploy the latest GitHub `main` commit to that Worker. The repository now declares the `MEDIA` binding, so it is retained on later deployments.
3. If connecting through the dashboard, open **Workers & Pages → the correct Worker → Bindings → Add binding → R2 bucket**. Use variable name `MEDIA`, select bucket `homey`, and save/deploy.
4. Refresh `/admin`, then open **Media** or edit a product. Upload a JPEG, PNG or WebP up to 10 MB. Save the product after attaching its new image URL.

Keep the bucket private. The Worker serves product objects through `/media/uploads/...`; a public R2 development URL, custom bucket domain or CORS policy is not required for this flow.

The two website domains use separate Workers. Each Worker needs its own `MEDIA` binding. If the Workers belong to different Cloudflare accounts, each account must have the intended bucket named `homey`; a native binding cannot point at another account merely by pasting its S3 endpoint. If the Workers are in the same account, both can bind the same bucket, which also shares their uploaded catalogue objects.

If a deployment reports that the bucket does not exist, check the selected Cloudflare account and exact bucket name. If it reports an R2 permissions error, the deployment token needs permission to bind that account's R2 bucket. Preserve the existing database and bucket contents while correcting the connection.

## Check the connection

While signed into `/admin`, open `/api/admin/status` on that same domain. `"media": true` means the running Worker has received the binding. The **Media** panel refreshes this status when opened. A successful upload and image preview verify actual bucket access.

## Why payment screenshots already work

Product photos use `MEDIA`. Payment evidence uses a separate storage path: private D1 database storage by default, up to 1 MB per screenshot. Adding the product bucket does not move payment screenshots or make them public. A separate private bucket bound as `PAYMENTS` can optionally store new payment screenshots up to 5 MB. Original catalogue photos continue to ship with the website.
