SELECT
    l.name                                                              AS store,
    p.name                                                              AS product,
    u.code                                                              AS unit,
    SUM(CASE WHEN mt.direction = 'IN' THEN sm.quantity ELSE 0 END)      AS units_in,
    SUM(CASE WHEN mt.code = 'SALE'    THEN sm.quantity ELSE 0 END)      AS units_sold,
    ROUND(100 * SUM(CASE WHEN mt.code = 'SALE' THEN sm.quantity ELSE 0 END)
              / NULLIF(SUM(CASE WHEN mt.direction = 'IN' THEN sm.quantity ELSE 0 END), 0), 1)
                                                                        AS sell_through_pct,
    i.quantity_on_hand,
    COALESCE(rv.revenue, 0)                                             AS revenue
FROM stock_movement sm
JOIN movement_type mt  ON mt.movement_type_id = sm.movement_type_id
JOIN location l        ON l.location_id       = sm.location_id
JOIN location_type lt  ON lt.location_type_id = l.location_type_id
JOIN product p         ON p.product_id        = sm.product_id
JOIN unit_of_measure u ON u.uom_id            = p.uom_id
JOIN inventory i       ON i.product_id = sm.product_id AND i.location_id = sm.location_id
LEFT JOIN (
    SELECT s.location_id, sl.product_id,
           ROUND(SUM(sl.quantity_sold * sl.unit_price - sl.discount_applied), 2) AS revenue
    FROM store_sale_line sl
    JOIN store_sale s ON s.store_sale_id = sl.store_sale_id
    GROUP BY s.location_id, sl.product_id
) rv ON rv.location_id = sm.location_id AND rv.product_id = sm.product_id
WHERE lt.name = 'STORE'
GROUP BY l.location_id, l.name, p.product_id, p.name, u.code, i.quantity_on_hand, rv.revenue
ORDER BY sell_through_pct DESC, units_in DESC;