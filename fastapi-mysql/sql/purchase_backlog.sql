SELECT
    x.po_id,
    x.supplier,
    x.deliver_to,
    x.po_status,
    x.expected_date,
    x.product,
    x.unit,
    x.quantity_ordered,
    x.qty_received,
    x.quantity_ordered - x.qty_received                           AS qty_outstanding,
    ROUND((x.quantity_ordered - x.qty_received) * x.unit_cost, 2) AS value_outstanding,
    GREATEST(DATEDIFF(:as_of_date, x.expected_date), 0)           AS days_overdue
FROM (
    SELECT
        po.po_id,
        s.name   AS supplier,
        l.name   AS deliver_to,
        st.code  AS po_status,
        po.expected_date,
        p.name   AS product,
        u.code   AS unit,
        pl.quantity_ordered,
        pl.unit_cost,
        COALESCE((
            SELECT SUM(rl.quantity_received)
            FROM receipt_line rl
            WHERE rl.po_id      = pl.po_id
              AND rl.product_id = pl.product_id
        ), 0)    AS qty_received
    FROM purchase_order po
    JOIN status st          ON st.status_id  = po.status_id
    JOIN supplier s         ON s.supplier_id = po.supplier_id
    JOIN location l         ON l.location_id = po.dest_location_id
    JOIN po_line pl         ON pl.po_id      = po.po_id
    JOIN product p          ON p.product_id  = pl.product_id
    JOIN unit_of_measure u  ON u.uom_id      = p.uom_id
    WHERE st.code IN ('SUBMITTED', 'PARTIALLY_RECEIVED')
) x
WHERE x.quantity_ordered > x.qty_received
ORDER BY days_overdue DESC, value_outstanding DESC;