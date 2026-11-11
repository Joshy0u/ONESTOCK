-- Every location with its stock summary, for dropdowns and the network map.
SELECT
    l.location_id,
    l.name,
    lt.name                                                     AS location_type,
    l.address,
    l.city,
    l.state,
    CAST(l.zip AS CHAR)                                         AS zip,
    l.total_storage_space,
    COUNT(i.inventory_id)                                       AS skus_stocked,
    COALESCE(SUM(i.quantity_on_hand), 0)                        AS units_on_hand,
    COALESCE(ROUND(SUM(i.quantity_on_hand
                       * COALESCE(ps.supplier_price, p.list_price)), 2), 0) AS value_on_hand,
    COALESCE(SUM(i.quantity_on_hand > 0
                 AND i.quantity_on_hand <= i.reorder_point), 0)  AS low_stock,
    COALESCE(SUM(i.quantity_on_hand <= 0), 0)                   AS out_of_stock
FROM location l
JOIN location_type lt ON lt.location_type_id = l.location_type_id
LEFT JOIN inventory i ON i.location_id = l.location_id
LEFT JOIN product p   ON p.product_id  = i.product_id
LEFT JOIN (
    SELECT product_id, MIN(supplier_price) AS supplier_price
    FROM product_supplier WHERE is_preferred = 1 GROUP BY product_id
) ps ON ps.product_id = p.product_id
GROUP BY l.location_id, l.name, lt.name, l.address, l.city, l.state, l.zip, l.total_storage_space
ORDER BY lt.name, l.name;
