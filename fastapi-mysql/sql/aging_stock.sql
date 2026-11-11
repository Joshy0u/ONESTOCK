WITH last_move AS (
    SELECT sm.product_id,
           sm.location_id,
           MAX(CASE WHEN mt.direction = 'IN'  THEN sm.movement_date END) AS last_in,
           MAX(CASE WHEN mt.direction = 'OUT' THEN sm.movement_date END) AS last_out,
           MAX(sm.movement_date)                                         AS last_any
    FROM stock_movement sm
    JOIN movement_type mt ON mt.movement_type_id = sm.movement_type_id
    GROUP BY sm.product_id, sm.location_id
)
SELECT
    l.name                                                          AS location,
    p.name                                                          AS product,
    u.code                                                          AS unit,
    i.quantity_on_hand,
    DATE(lm.last_in)                                                AS last_received,
    DATE(lm.last_out)                                               AS last_sent_or_sold,
    DATEDIFF(:as_of_date, lm.last_any)                              AS days_without_movement,
    ROUND(i.quantity_on_hand * ps.supplier_price, 2)                AS value_at_cost,
    ROUND(100 * i.quantity_on_hand * ps.supplier_price / (
        SELECT SUM(i2.quantity_on_hand * ps2.supplier_price)
        FROM inventory i2
        JOIN product_supplier ps2 ON ps2.product_id = i2.product_id
                                 AND ps2.is_preferred = 1
    ), 1)                                                           AS pct_of_network_value
FROM inventory i
JOIN last_move lm             ON lm.product_id  = i.product_id AND lm.location_id = i.location_id
JOIN product p                ON p.product_id   = i.product_id
JOIN unit_of_measure u        ON u.uom_id       = p.uom_id
JOIN location l               ON l.location_id  = i.location_id
JOIN product_supplier ps      ON ps.product_id  = i.product_id AND ps.is_preferred = 1
WHERE i.quantity_on_hand > 0
  AND DATEDIFF(:as_of_date, lm.last_any) >= 30
ORDER BY value_at_cost DESC
LIMIT 15;