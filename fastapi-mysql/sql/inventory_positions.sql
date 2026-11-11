-- One row per (product, location) inventory position, joined to everything the
-- inventory table in the UI needs. stock_status is derived from the reorder point.
SELECT
    i.inventory_id,
    i.product_id,
    p.name                                                                   AS product,
    p.sku,
    c.name                                                                   AS category,
    dept.name                                                                AS department,
    u.code                                                                   AS unit,
    i.location_id,
    l.name                                                                   AS location,
    lt.name                                                                  AS location_type,
    i.quantity_on_hand,
    i.reorder_point,
    i.reorder_quantity,
    COALESCE(ps.supplier_price, p.list_price)                                AS unit_cost,
    p.list_price,
    ROUND(i.quantity_on_hand * COALESCE(ps.supplier_price, p.list_price), 2) AS value_at_cost,
    CASE
        WHEN i.quantity_on_hand <= 0               THEN 'OUT_OF_STOCK'
        WHEN i.quantity_on_hand <= i.reorder_point THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END                                                                      AS stock_status,
    i.last_updated
FROM inventory i
JOIN product p             ON p.product_id        = i.product_id
JOIN product_category c    ON c.category_id       = p.category_id
JOIN product_category dept ON dept.category_id    = COALESCE(c.parent_category_id, c.category_id)
JOIN unit_of_measure u     ON u.uom_id            = p.uom_id
JOIN location l            ON l.location_id       = i.location_id
JOIN location_type lt      ON lt.location_type_id = l.location_type_id
LEFT JOIN (
    SELECT product_id, MIN(supplier_price) AS supplier_price
    FROM product_supplier
    WHERE is_preferred = 1
    GROUP BY product_id
) ps ON ps.product_id = p.product_id
ORDER BY p.name, l.name;
