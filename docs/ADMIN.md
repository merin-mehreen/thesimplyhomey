# Managing homéy

Visit `/admin` on your store's address. Sign in using the admin password configured in Cloudflare. The password is never placed in a public JavaScript file.

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

The imported “Standard — dimensions to confirm” values are setup placeholders. Replace them with actual sizes before taking orders. Different photos within one source folder are kept as a gallery; do not assume they represent purchasable colour variants until you confirm that.

## Add a category

Select **Categories** → **Add category**. Give it a lowercase slug, name, brand, introduction and optional cover photo. Published homéy categories automatically appear in navigation and have a collection page. This is how you can add candles, table runners or future home accessories without editing HTML. Products must be moved out before a category can be deleted. Hide a category to temporarily remove it and its products from shopping.

Raya products remain inside the same store and shopping bag. Their pages use the Raya palette. The main navigation uses the supplied Raya logo. The initial Raya image is a textile placeholder only, stored as an unpublished draft; replace it with actual jewellery photography and remove the placeholder flag before publishing.

## Contact details, content and policies

In **Store settings**, update shared email, WhatsApp, Instagram and Facebook fields. Use the international WhatsApp number and full `https://` social URLs. These settings feed every customer-facing contact link. Empty fields are omitted rather than linking to a fake account.

The same screen controls the top announcement, homepage headline/introduction/image, brand introductions, delivery fee, ordering toggle and policy pages. Colour palettes and page composition remain code-level design settings.

## Upload images

Use **Media** to upload JPEG, PNG or WebP images up to 10 MB each. Select a thumbnail to copy its URL, then paste it into a product or other image field. Media comes from the original catalogue and your R2 uploads. Uploaded image names are random and do not overwrite another product's photos.

## Orders and stock

Checkout starts disabled. Once factual product details, pricing, inventory, contact details and policies are ready, enable it in Store settings. It accepts cash-on-delivery orders only. The server checks current prices and stock, records the order and deducts inventory together. It does not accept a price submitted by the shopper's browser.

Use **Orders** to view contact information and purchased variants, then mark an order confirmed, dispatched, delivered or cancelled. There are no automatic customer emails or courier bookings. Cancelled orders require manual stock adjustment after you verify what should be restocked.

If a product or its stock changes while your edit form is open, saving is blocked with a conflict message. Go back and reopen the product to load current stock, then apply your changes. Stock adjustment history is not included.

## Backups

Download a catalogue backup regularly. It includes current products, stock, categories and store settings, but excludes customer orders and image bytes. Maintain private D1 database and R2 media backups separately in Cloudflare.
