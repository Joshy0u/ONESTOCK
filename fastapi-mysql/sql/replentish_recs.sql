WITH received AS (
            SELECT po_id, product_id, SUM(quantity_received) AS qty
            FROM receipt_line
            GROUP BY po_id, product_id
        ),
        inbound_po AS (
            SELECT po.dest_location_id AS location_id,
                   pl.product_id,
                   SUM(pl.quantity_ordered - COALESCE(r.qty, 0)) AS qty
            FROM purchase_order po
            JOIN status st ON st.status_id = po.status_id
            JOIN po_line pl ON pl.po_id = po.po_id
            LEFT JOIN received r ON r.po_id = pl.po_id AND r.product_id = pl.product_id
            WHERE st.code IN ('SUBMITTED', 'PARTIALLY_RECEIVED')
            GROUP BY po.dest_location_id, pl.product_id
            HAVING SUM(pl.quantity_ordered - COALESCE(r.qty, 0)) > 0
        ),
        inbound_transfer AS (
            SELECT t.to_location_id AS location_id,
                   tl.product_id,
                   SUM(tl.quantity_requested - tl.quantity_received) AS qty
            FROM transfer_order t
            JOIN status st ON st.status_id = t.status_id
            JOIN transfer_line tl ON tl.transfer_order_id = t.transfer_order_id
            WHERE st.code IN ('SUBMITTED', 'IN_TRANSIT')
            GROUP BY t.to_location_id, tl.product_id
        ),
        dc_surplus AS (
            SELECT i.product_id,
                   i.location_id,
                   l.name AS dc_name,
                   i.quantity_on_hand - i.reorder_point AS surplus,
                   ROW_NUMBER() OVER (PARTITION BY i.product_id
                                      ORDER BY i.quantity_on_hand - i.reorder_point DESC,
                                               i.location_id) AS rn
            FROM inventory i
            JOIN location l ON l.location_id = i.location_id
            JOIN location_type lt ON lt.location_type_id = l.location_type_id
            WHERE lt.name = 'DC'
              AND i.quantity_on_hand > i.reorder_point
        )
        SELECT
            x.location,
            x.product,
            x.unit,
            x.quantity_on_hand,
            x.reorder_point,
            x.inbound,
            x.recommended_action,
            x.suggested_qty,
            x.preferred_supplier,
            CASE WHEN x.recommended_action = 'Create PO'
                 THEN ROUND(x.suggested_qty * x.supplier_price, 2) END AS est_purchase_cost
        FROM (
            SELECT
                l.location_id,
                l.name AS location,
                p.name AS product,
                u.code AS unit,
                i.quantity_on_hand,
                i.reorder_point,
                COALESCE(ip.qty, 0) + COALESCE(it.qty, 0) AS inbound,
                CASE
                    WHEN i.quantity_on_hand + COALESCE(ip.qty, 0) + COALESCE(it.qty, 0) > i.reorder_point
                        THEN 'Covered by inbound stock'
                    WHEN ds.location_id IS NOT NULL
                        THEN CONCAT('Transfer from ', ds.dc_name)
                    ELSE 'Create PO'
                END AS recommended_action,
                CASE
                    WHEN i.quantity_on_hand + COALESCE(ip.qty, 0) + COALESCE(it.qty, 0) > i.reorder_point
                        THEN 0
                    WHEN ds.location_id IS NOT NULL
                        THEN LEAST(i.reorder_quantity, ds.surplus)
                    ELSE i.reorder_quantity
                END AS suggested_qty,
                CASE
                    WHEN i.quantity_on_hand + COALESCE(ip.qty, 0) + COALESCE(it.qty, 0) <= i.reorder_point
                     AND ds.location_id IS NULL
                        THEN s.name
                END AS preferred_supplier,
                ps.supplier_price
            FROM inventory i
            JOIN product p ON p.product_id = i.product_id
            JOIN unit_of_measure u ON u.uom_id = p.uom_id
            JOIN location l ON l.location_id = i.location_id
            LEFT JOIN inbound_po ip ON ip.location_id = i.location_id AND ip.product_id = i.product_id
            LEFT JOIN inbound_transfer it ON it.location_id = i.location_id AND it.product_id = i.product_id
            LEFT JOIN dc_surplus ds ON ds.product_id = i.product_id AND ds.rn = 1 AND ds.location_id <> i.location_id
            LEFT JOIN product_supplier ps ON ps.product_id = i.product_id AND ps.is_preferred = 1
            LEFT JOIN supplier s ON s.supplier_id = ps.supplier_id
            WHERE i.quantity_on_hand <= i.reorder_point
        ) x
        ORDER BY FIELD(LEFT(x.recommended_action, 6), 'Create', 'Transf', 'Covere'),
                 x.quantity_on_hand / x.reorder_point;