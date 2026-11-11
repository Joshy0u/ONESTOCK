-- Latest stock movements (receipts, sales, transfers, adjustments) for the
-- Recent activity feed.
SELECT
    sm.movement_id,
    sm.movement_date,
    mt.code                 AS movement_type,
    mt.direction,
    p.product_id,
    p.name                  AS product,
    u.code                  AS unit,
    l.location_id,
    l.name                  AS location,
    sm.quantity,
    sm.reference_id
FROM stock_movement sm
JOIN movement_type mt  ON mt.movement_type_id = sm.movement_type_id
JOIN product p         ON p.product_id        = sm.product_id
JOIN unit_of_measure u ON u.uom_id            = p.uom_id
JOIN location l        ON l.location_id       = sm.location_id
ORDER BY sm.movement_date DESC, sm.movement_id DESC
LIMIT :limit;
