SELECT
    t.transfer_order_id,
    lf.name                                                       AS from_location,
    lt2.name                                                      AS to_location,
    st.code                                                       AS status,
    c.name                                                        AS carrier,
    sh.tracking_number,
    COUNT(tl.transfer_line_id)                                    AS product_lines,
    SUM(tl.quantity_received >= tl.quantity_shipped)              AS lines_fully_received,
    ROUND(SUM(tl.quantity_shipped * p.list_price), 2)             AS value_shipped,
    t.ship_date,
    t.delivery_date,
    ROUND(TIMESTAMPDIFF(MINUTE, t.ship_date,
          COALESCE(t.delivery_date, @as_of_date)) / 60, 1)        AS hours_on_road,
    CASE
        WHEN sh.shipment_id IS NULL                       THEN 'No shipment record'
        WHEN sh.actual_arrival IS NULL
         AND sh.estimated_arrival < @as_of_date           THEN 'Overdue'
        WHEN sh.actual_arrival IS NULL                    THEN 'On the way'
        WHEN sh.actual_arrival <= sh.estimated_arrival    THEN 'Arrived on time'
        ELSE 'Arrived late'
    END                                                           AS delivery_check
FROM transfer_order t
JOIN location lf      ON lf.location_id  = t.from_location_id
JOIN location lt2     ON lt2.location_id = t.to_location_id
JOIN status st        ON st.status_id    = t.status_id
JOIN transfer_line tl ON tl.transfer_order_id = t.transfer_order_id
JOIN product p        ON p.product_id    = tl.product_id
LEFT JOIN shipment sh ON sh.transfer_order_id = t.transfer_order_id
LEFT JOIN carrier c   ON c.carrier_id    = sh.carrier_id
GROUP BY t.transfer_order_id, lf.name, lt2.name, st.code, c.name, sh.tracking_number,
         t.ship_date, t.delivery_date, sh.shipment_id, sh.actual_arrival, sh.estimated_arrival
ORDER BY FIELD(st.code, 'IN_TRANSIT', 'SUBMITTED', 'COMPLETED', 'CANCELLED'), t.ship_date DESC;