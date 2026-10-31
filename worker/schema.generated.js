// Generated from migrations by scripts/schema.mjs.
export const base = [
  "CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)), updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS variants (id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE, stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0))",
  "CREATE INDEX IF NOT EXISTS variants_product ON variants(product_id)",
  "CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)))",
  "CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY CHECK(id='store'), data TEXT NOT NULL CHECK(json_valid(data)))",
  "CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, data TEXT NOT NULL CHECK(json_valid(data)), status TEXT NOT NULL DEFAULT 'new', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)",
  "CREATE TABLE IF NOT EXISTS login_attempts (ip TEXT PRIMARY KEY, attempts INTEGER NOT NULL DEFAULT 0, reset_at INTEGER NOT NULL)"
];
export const integrity = "-- Prevent deleted, unpublished, repriced or cross-category items entering an order\n-- between the initial quote and the atomic inventory/order batch.\nCREATE TRIGGER IF NOT EXISTS order_items_available BEFORE INSERT ON orders\nBEGIN\n SELECT CASE WHEN EXISTS (\n SELECT 1 FROM json_each(NEW.data,'$.items') AS item\n WHERE NOT EXISTS (\n SELECT 1 FROM variants v JOIN products p ON v.product_id=p.id\n JOIN categories c ON c.id=json_extract(p.data,'$.category')\n JOIN json_each(p.data,'$.variants') pv ON json_extract(pv.value,'$.id')=v.id\n WHERE v.id=json_extract(item.value,'$.variantId')\n AND p.id=json_extract(item.value,'$.productId')\n AND json_extract(p.data,'$.published')=1\n AND COALESCE(json_extract(p.data,'$.placeholder'),0)=0\n AND json_extract(c.data,'$.published')=1\n AND COALESCE(json_extract(pv.value,'$.price'),json_extract(p.data,'$.price'))=json_extract(item.value,'$.price')\n )) THEN RAISE(ABORT,'Product changed during checkout') END;\nEND;\n";
export const stockTrigger = "CREATE TRIGGER IF NOT EXISTS stock_revision AFTER UPDATE OF stock ON variants\nWHEN NEW.stock <> OLD.stock\nBEGIN\n UPDATE products SET revision=revision+1 WHERE id=NEW.product_id;\nEND;\n";
