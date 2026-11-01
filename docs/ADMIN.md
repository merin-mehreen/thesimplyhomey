# Managing homéy

Visit `/admin` on your store's address. Sign in using the admin password configured in Cloudflare. The password is never placed in a public JavaScript file. Choose it in Cloudflare → Workers & Pages → your Worker → Settings → Variables and Secrets, under ADMIN_PASSWORD. Also set SESSION_SECRET to an independent random value of at least 32 characters, then save/deploy. See [Cloudflare setup](CLOUDFLARE.md) for detailed steps.

## Add or change a product

1. Select **Products**, then **Add product**, or edit an existing design.
2. Enter a clear product name and URL slug. The slug becomes `/products/your-slug`.
3. Choose homéy or Raya, then its category.
4. Set the selling price. Leave it blank for “Price on enquiry”. To display a discount, enter the genuine original price above the selling price. The collection card computes the discount percentage.
5. Write the factual description and care details.
6. Upload photographs or paste image URLs, one per line. The first image is the cover; the rest appear as gallery thumbnails. Reorder the lines to change their order. Removing an image URL does not delete the underlying file from storage.
7. Set the variants. Each row is one size + colour + type combination, with its own stock and optional price override. A blank variant price inherits the main price. Keep all three option fields even for a single option.
8. Tick **Published** to show it in the store. **Featured** makes a homéy product eligible for the homepage's four featured positions. The category must also be published.
9. Save changes. The live catalogue reads the updated data on its next load; no deployment is required.

The initial prices, sizes and stock are provisional setup values. Replace them with confirmed business values before accepting public orders. Different photos within one source folder are kept as a gallery; do not assume they represent purchasable colour variants until you confirm that.

## Add a category

Select **Categories** → **Add category**. Give it a lowercase slug, name, brand, introduction and optional cover photo. Published homéy categories automatically appear in navigation and have a collection page. This is how you can add candles, table runners or future home accessories without editing HTML. Products must be moved out before a category can be deleted. Hide a category to temporarily remove it and its products from shopping.

Raya products remain inside the same store and shopping bag. Their pages use the Raya palette. The main navigation uses the supplied Raya logo. The initial Raya image is a textile placeholder only, stored as an unpublished draft; replace it with actual jewellery photography and remove the placeholder flag before publishing.

## Contact details, content and policies

In **Store settings**, update shared email, WhatsApp, Instagram and Facebook fields. Use the international WhatsApp number and full `https://` social URLs. These settings feed every customer-facing contact link. Enter real contact details. Empty channels are omitted instead of linking to unverified accounts.

The same screen controls the homepage headline/introduction/image, brand introductions, delivery fee, ordering toggle and policy pages. Colour palettes and page composition remain code-level design settings.

## Upload images

Use **Media** to upload JPEG, PNG or WebP images up to 10 MB each. The deployment configuration declares a `MEDIA` binding without an account-specific bucket name. Existing Worker bindings are inherited; otherwise Wrangler provisions a bucket in that Worker’s account. Enable R2 in that account, deploy the latest commit and refresh admin. To use an existing bucket, connect it as `MEDIA` on the correct Worker first. Existing catalogue photos or HTTPS image URLs can also be used. See [Product image uploads](MEDIA.md) for setup and checks. Select a thumbnail to copy its URL, then paste it into a product or other image field. Media comes from the original catalogue and your R2 uploads. Uploaded image names are random and do not overwrite another product's photos.

## Orders and stock

EasyPaisa checkout is enabled. It collects delivery details, saves an order number and reserves stock. Customers submit a transaction reference and private screenshot on the separate payment page. You can pause ordering with the checkout toggle in Store settings. Enter the actual EasyPaisa account title and number before collecting payments. The server checks current prices and stock, records the order and deducts inventory together. It does not accept a price submitted by the shopper's browser.

Use **Orders** to view contact information and purchased variants, then mark an order confirmed, dispatched, delivered or cancelled. Inspect the linked payment screenshot and verify the actual wallet transfer before approving. There are no automatic customer emails or courier bookings. Cancelling an unpaid order automatically releases reserved stock once. Payment must be approved before confirmation or dispatch. Paid orders require a separate refund review before cancellation.

If a product or its stock changes while your edit form is open, saving is blocked with a conflict message. Go back and reopen the product to load current stock, then apply your changes. Stock adjustment history is not included.

## Backups

Download a catalogue backup regularly. It includes current products, stock, categories and store settings, but excludes customer orders and image bytes. Maintain private D1 database and R2 media backups separately in Cloudflare.

## Sales and inventory ledgers

Use Sales ledger for date/payment/order-status/customer filters and CSV export. Use Inventory ledger to record stock additions/adjustments with a reason, review movement history and export CSV. See [Payments and ledgers](PAYMENTS_AND_LEDGERS.md) for the full workflow. Brand logos, navigation labels and main homepage section copy/photos can be edited in Store settings; page layout and CSS remain developer-controlled.
