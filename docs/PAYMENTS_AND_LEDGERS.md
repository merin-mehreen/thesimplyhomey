# EasyPaisa payments, sales and stock

## Customer flow

1. Add products to the bag and open `/cart`.
2. Continue to `/checkout`, enter delivery details and place the order.
3. The server checks current prices and stock, reserves the selected stock, saves the order and issues a unique order number.
4. `/payment?order=ORDER_REFERENCE` displays the order total and the EasyPaisa account configured by the owner.
5. The customer transfers the funds, then submits the EasyPaisa transaction reference and a screenshot.
6. The payment becomes **Pending review**. The owner checks the actual transfer and approves or rejects the evidence in admin.

This is manual EasyPaisa transfer, not an integrated gateway. The website cannot check the wallet balance or confirm a transfer automatically. There is no cash-on-delivery option. A screenshot is evidence for review, not proof that money has arrived.

Customers can pay later: the payment page accepts the complete saved order number. The full reference is deliberately random rather than sequential. Lookup returns only order totals/status, not personal details or receipt images. Customers should retain and protect their reference.

## Configure the account

In `/admin` → **Store settings**, enter:

- EasyPaisa account title.
- EasyPaisa account number.
- Payment instructions.
- Your actual customer-service email, WhatsApp and social links.

No payment recipient account is invented. Until an account is configured, the payment page tells customers to retain their reference and contact the store before transferring.

## Private screenshot storage

The default installation stores original screenshots as private binary files in **Cloudflare D1**, linked to an order and submission ID. The limit is **1 MB per screenshot**. This works with the existing database binding and does not require R2 to be enabled.

For larger uploads and a growing store, enable a separate **private R2 bucket** bound as `PAYMENTS`. Run `npm run storage:enable` in a checkout, commit the configuration, and redeploy after enabling R2 in your Cloudflare account. This adds both `MEDIA` (catalogue images) and `PAYMENTS` (payment evidence) bindings. Wrangler provisions separate buckets. The screenshot limit then becomes **5 MB**. Existing screenshots remain readable from their original storage location; the change does not move older D1 files.

Do not give the PAYMENTS bucket a public domain or enable public r2.dev access. Payment objects use the `payment-evidence/` prefix and are not served by the public `/media/` route. The database stores the order link, transaction reference, content type, file size and review status. There is no public screenshot URL: the admin image endpoint checks the signed login cookie and responds with `Cache-Control: no-store`.

Accepted formats are JPEG, PNG and WebP. File size, type and signature are checked on the server. SVGs and documents are rejected. Original uploads are retained without image alterations.

Each order can have only one pending submission and one approved submission. Active transaction references cannot be reused across orders. Rejected evidence can be resubmitted with a corrected screenshot/reference. At most five submissions are accepted per order; further corrections require the store's assistance.

## Reviewing an order

Open **Orders** or **Sales ledger**, choose the order and inspect its payment evidence. The order detail includes the customer, purchased variants, total, transaction reference, screenshot, timestamps and review notes.

- **Approve:** first verify the transfer in your actual EasyPaisa account, then tick the verification checkbox and approve. Payment becomes Paid and a new order becomes Confirmed.
- **Reject:** enter a reason. The customer can return to the payment page and submit corrected evidence.
- Unpaid orders cannot be confirmed or dispatched.
- Cancellation of an unpaid order releases the reserved stock exactly once and records a movement.
- A paid order cannot be cancelled through the unpaid-order path. Refunds require a separate manual review; this website does not send money back or automate refunds.

## Sales ledger

Filter by order date range, payment state, fulfilment status, customer name, phone or order reference. The ledger includes each order's value and links to its evidence/review detail.

Summary figures distinguish:

- **Verified receipts:** totals of payments manually approved by the owner, including delivery fees.
- **Outstanding active orders:** unpaid order totals excluding cancelled orders.
- **Paid units:** product quantities in paid orders.
- **Orders:** the number matching the filters.

These figures are not profit calculations. No cost of goods, tax engine or bank reconciliation integration is included. Sales date filters use the order placement date; the CSV also includes the payment approval time.

## Inventory ledger

The ledger records opening balances, stock additions/adjustments, order reservations, cancellations and removed variants. Each movement includes quantity change, balance after, product/variant, reason, note, timestamp and linked order when relevant.

Use **Inventory ledger → Add stock or record an adjustment** to add received stock or remove a quantity. Enter a delivery/invoice reference or reason. A negative balance is rejected. Product editing also records actual quantity changes; changing descriptions or prices does not invent stock movements.

Stock is reserved when an order is placed, not when a screenshot is approved. Payment approval therefore does not deduct it a second time. Unpaid orders do not expire automatically: review and cancel abandoned orders to release their stock. Variants reserved by active orders cannot be deleted. A product can be unpublished while retaining its stock and order history.

The opening balance begins when this ledger is activated; earlier stock receipts cannot be reconstructed if they were never recorded. Existing products, current stock and order records are preserved during the upgrade.

## Exports and backups

Both ledgers have **Export CSV**. The current filters apply to the export. Data is paginated in the interface. A single CSV export supports up to 10,000 records; narrow the dates if needed. Formula-like text is escaped to protect spreadsheet imports.

CSV files contain references to screenshots, not the screenshot bytes. Keep full private D1 backups; they include default receipt files. If PAYMENTS R2 is enabled, back up that separate bucket as well. Catalogue JSON exports alone are not complete backups. Do not place customer/payment backups in the public GitHub repository.
