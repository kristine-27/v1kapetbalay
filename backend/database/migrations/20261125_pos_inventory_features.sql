-- Kape't Balay POS + automatic inventory deduction migration
-- This is the migration previously applied to the active project database.
-- Do NOT run again if order_type, idempotency_key, drink_size, and the unique
-- idempotency index already exist.

ALTER TABLE orders
    ADD COLUMN order_type ENUM('Dine In', 'Take Out') NULL AFTER daily_order_number,
    ADD COLUMN idempotency_key VARCHAR(64) NULL,
    ADD UNIQUE KEY uq_orders_idempotency_key (idempotency_key);

ALTER TABLE order_items
    ADD COLUMN drink_size ENUM('22oz', '24oz') NULL AFTER subtotal;

UPDATE inventory
SET item_name = 'Tissue'
WHERE LOWER(TRIM(item_name)) = 'tisssue';
