CREATE TRIGGER IF NOT EXISTS inventory_insert AFTER INSERT ON variants WHEN NEW.stock>0
BEGIN
 INSERT INTO inventory_movements(variant_id,product_id,product_name,variant_label,quantity,stock_after,reason,order_id,note)
 SELECT NEW.id,NEW.product_id,COALESCE(json_extract(p.data,'$.name'),NEW.product_id),
 COALESCE((SELECT json_extract(v.value,'$.size')||' / '||json_extract(v.value,'$.color')||' / '||json_extract(v.value,'$.type') FROM json_each(p.data,'$.variants') v WHERE json_extract(v.value,'$.id')=NEW.id),NEW.id),
 NEW.stock,NEW.stock,COALESCE((SELECT reason FROM inventory_context WHERE id=1),'opening_stock'),(SELECT order_id FROM inventory_context WHERE id=1),COALESCE((SELECT note FROM inventory_context WHERE id=1),'')
 FROM products p WHERE p.id=NEW.product_id;
END;
CREATE TRIGGER IF NOT EXISTS inventory_update AFTER UPDATE OF stock ON variants WHEN NEW.stock<>OLD.stock
BEGIN
 INSERT INTO inventory_movements(variant_id,product_id,product_name,variant_label,quantity,stock_after,reason,order_id,note)
 SELECT NEW.id,NEW.product_id,COALESCE(json_extract(p.data,'$.name'),NEW.product_id),
 COALESCE((SELECT json_extract(v.value,'$.size')||' / '||json_extract(v.value,'$.color')||' / '||json_extract(v.value,'$.type') FROM json_each(p.data,'$.variants') v WHERE json_extract(v.value,'$.id')=NEW.id),NEW.id),
 NEW.stock-OLD.stock,NEW.stock,COALESCE((SELECT reason FROM inventory_context WHERE id=1),CASE WHEN NEW.stock>OLD.stock THEN 'restock' ELSE 'adjustment' END),(SELECT order_id FROM inventory_context WHERE id=1),COALESCE((SELECT note FROM inventory_context WHERE id=1),'')
 FROM products p WHERE p.id=NEW.product_id;
END;
CREATE TRIGGER IF NOT EXISTS inventory_delete AFTER DELETE ON variants WHEN OLD.stock>0
BEGIN
 INSERT INTO inventory_movements(variant_id,product_id,product_name,variant_label,quantity,stock_after,reason,order_id,note)
 VALUES(OLD.id,OLD.product_id,COALESCE((SELECT json_extract(data,'$.name') FROM products WHERE id=OLD.product_id),OLD.product_id),OLD.id,-OLD.stock,0,'variant_removed',NULL,'Variant or product removed');
END;
CREATE TRIGGER IF NOT EXISTS payment_accept_active BEFORE INSERT ON payment_submissions
BEGIN
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM orders WHERE id=NEW.order_id AND status<>'cancelled' AND payment_status<>'paid') THEN RAISE(ABORT,'Order is not awaiting payment') END;
END;
CREATE TRIGGER IF NOT EXISTS payment_submitted AFTER INSERT ON payment_submissions
BEGIN
 UPDATE orders SET payment_status='pending_review' WHERE id=NEW.order_id;
END;
CREATE TRIGGER IF NOT EXISTS payment_review_active BEFORE UPDATE OF status ON payment_submissions WHEN NEW.status<>OLD.status
BEGIN
 SELECT CASE WHEN OLD.status<>'pending' THEN RAISE(ABORT,'Evidence has already been reviewed') END;
 SELECT CASE WHEN NOT EXISTS(SELECT 1 FROM orders WHERE id=NEW.order_id AND status<>'cancelled' AND payment_status<>'paid') THEN RAISE(ABORT,'Order is not awaiting payment') END;
END;
CREATE TRIGGER IF NOT EXISTS payment_approved AFTER UPDATE OF status ON payment_submissions WHEN NEW.status='approved' AND OLD.status='pending'
BEGIN
 UPDATE orders SET payment_status='paid',paid_at=CURRENT_TIMESTAMP,status=CASE WHEN status='new' THEN 'confirmed' ELSE status END WHERE id=NEW.order_id;
 INSERT INTO admin_audit(action,reference,note) VALUES('payment_approved',NEW.order_id,NEW.transaction_ref);
END;
CREATE TRIGGER IF NOT EXISTS payment_rejected AFTER UPDATE OF status ON payment_submissions WHEN NEW.status='rejected' AND OLD.status='pending'
BEGIN
 UPDATE orders SET payment_status='rejected' WHERE id=NEW.order_id;
 INSERT INTO admin_audit(action,reference,note) VALUES('payment_rejected',NEW.order_id,NEW.review_note);
END;
CREATE TRIGGER IF NOT EXISTS cancelled_order_restocks AFTER UPDATE OF status ON orders WHEN NEW.status='cancelled' AND OLD.status<>'cancelled'
BEGIN
 INSERT OR REPLACE INTO inventory_context(id,reason,order_id,note) VALUES(1,'order_cancelled',NEW.id,'Unpaid order cancelled; reserved stock released');
 UPDATE variants SET stock=stock+COALESCE((SELECT CAST(json_extract(item.value,'$.qty') AS INTEGER) FROM json_each(NEW.data,'$.items') item WHERE json_extract(item.value,'$.variantId')=variants.id),0)
 WHERE id IN (SELECT json_extract(item.value,'$.variantId') FROM json_each(NEW.data,'$.items') item);
 DELETE FROM inventory_context WHERE id=1;
 INSERT INTO admin_audit(action,reference,note) VALUES('order_cancelled',NEW.id,'Reserved stock released');
END;
CREATE TRIGGER IF NOT EXISTS order_status_guard BEFORE UPDATE OF status ON orders WHEN NEW.status<>OLD.status
BEGIN
 SELECT CASE WHEN OLD.status='cancelled' THEN RAISE(ABORT,'Cancelled orders cannot reopen') END;
 SELECT CASE WHEN NEW.status IN ('confirmed','dispatched','delivered') AND NEW.payment_status<>'paid' THEN RAISE(ABORT,'Payment must be approved first') END;
 SELECT CASE WHEN NEW.status='cancelled' AND OLD.payment_status='paid' THEN RAISE(ABORT,'Paid orders require a refund review') END;
END;
