-- Single-row summary for the Overview page header cards.
SELECT
    (SELECT COUNT(*) FROM product)                                                   AS total_products,
    (SELECT COUNT(*) FROM product_category WHERE parent_category_id IS NULL)         AS categories,
    (SELECT COUNT(*) FROM location)                                                  AS locations,
    (SELECT COUNT(*) FROM inventory)                                                 AS stocked_positions,
    (SELECT COUNT(DISTINCT product_id) FROM inventory)                               AS stocked_products,
    (SELECT ROUND(SUM(i.quantity_on_hand * COALESCE(ps.supplier_price, p.list_price)), 2)
       FROM inventory i
       JOIN product p ON p.product_id = i.product_id
       LEFT JOIN (
           SELECT product_id, MIN(supplier_price) AS supplier_price
           FROM product_supplier WHERE is_preferred = 1 GROUP BY product_id
       ) ps ON ps.product_id = p.product_id)                                         AS inventory_value,
    (SELECT COALESCE(SUM(quantity_on_hand), 0) FROM inventory)                       AS units_on_hand,
    (SELECT COUNT(*) FROM inventory
      WHERE quantity_on_hand > 0 AND quantity_on_hand <= reorder_point)              AS low_stock,
    (SELECT COUNT(*) FROM inventory WHERE quantity_on_hand <= 0)                     AS out_of_stock,
    (SELECT COUNT(*) FROM purchase_order po
       JOIN status st ON st.status_id = po.status_id
      WHERE st.code IN ('SUBMITTED', 'PARTIALLY_RECEIVED'))                          AS open_purchase_orders,
    (SELECT COUNT(*) FROM transfer_order t
       JOIN status st ON st.status_id = t.status_id
      WHERE st.code = 'IN_TRANSIT')                                                  AS transfers_in_transit,
    (SELECT MAX(movement_date) FROM stock_movement)                                  AS last_movement_at;
