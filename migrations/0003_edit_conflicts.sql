ALTER TABLE products ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE products ADD COLUMN last_write TEXT;
CREATE TRIGGER IF NOT EXISTS stock_revision AFTER UPDATE OF stock ON variants
WHEN NEW.stock <> OLD.stock
BEGIN
 UPDATE products SET revision=revision+1 WHERE id=NEW.product_id;
END;
