-- Prevent deleted, unpublished, repriced or cross-category items entering an order
-- between the initial quote and the atomic inventory/order batch.
CREATE TRIGGER IF NOT EXISTS order_items_available BEFORE INSERT ON orders
BEGIN
 SELECT CASE WHEN EXISTS (
 SELECT 1 FROM json_each(NEW.data,'$.items') AS item
 WHERE NOT EXISTS (
 SELECT 1 FROM variants v JOIN products p ON v.product_id=p.id
 JOIN categories c ON c.id=json_extract(p.data,'$.category')
 JOIN json_each(p.data,'$.variants') pv ON json_extract(pv.value,'$.id')=v.id
 WHERE v.id=json_extract(item.value,'$.variantId')
 AND p.id=json_extract(item.value,'$.productId')
 AND json_extract(p.data,'$.published')=1
 AND COALESCE(json_extract(p.data,'$.placeholder'),0)=0
 AND json_extract(c.data,'$.published')=1
 AND COALESCE(json_extract(pv.value,'$.price'),json_extract(p.data,'$.price'))=json_extract(item.value,'$.price')
 )) THEN RAISE(ABORT,'Product changed during checkout') END;
END;
