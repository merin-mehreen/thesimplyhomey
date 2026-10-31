ALTER TABLE orders ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'awaiting_payment';
ALTER TABLE orders ADD COLUMN paid_at TEXT;
CREATE TABLE IF NOT EXISTS payment_submissions (
 id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id), transaction_ref TEXT NOT NULL,
 storage TEXT NOT NULL CHECK(storage IN ('d1','r2')), object_key TEXT, mime_type TEXT NOT NULL,
 byte_size INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 review_note TEXT NOT NULL DEFAULT '', submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, reviewed_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS payment_txn_active ON payment_submissions(transaction_ref) WHERE status IN ('pending','approved');
CREATE UNIQUE INDEX IF NOT EXISTS payment_order_pending ON payment_submissions(order_id) WHERE status='pending';
CREATE UNIQUE INDEX IF NOT EXISTS payment_order_approved ON payment_submissions(order_id) WHERE status='approved';
CREATE INDEX IF NOT EXISTS payment_order_lookup ON payment_submissions(order_id,submitted_at);
CREATE TABLE IF NOT EXISTS payment_files (id TEXT NOT NULL REFERENCES payment_submissions(id) ON DELETE CASCADE, part INTEGER NOT NULL, bytes BLOB NOT NULL, PRIMARY KEY(id,part));
CREATE TABLE IF NOT EXISTS inventory_movements (
 id INTEGER PRIMARY KEY AUTOINCREMENT, variant_id TEXT NOT NULL, product_id TEXT NOT NULL,
 product_name TEXT NOT NULL, variant_label TEXT NOT NULL DEFAULT '', quantity INTEGER NOT NULL,
 stock_after INTEGER NOT NULL, reason TEXT NOT NULL, order_id TEXT, note TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS inventory_date ON inventory_movements(created_at,id);
CREATE INDEX IF NOT EXISTS inventory_product ON inventory_movements(product_id,variant_id);
CREATE TABLE IF NOT EXISTS inventory_context (id INTEGER PRIMARY KEY CHECK(id=1), reason TEXT NOT NULL, order_id TEXT, note TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS admin_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL, reference TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
