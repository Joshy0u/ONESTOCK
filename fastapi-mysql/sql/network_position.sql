SELECT
            p.product_id,
            p.name AS product,
            u.code AS unit,
            SUM(CASE WHEN lt.name = 'DC' THEN i.quantity_on_hand ELSE 0 END) AS dc_on_hand,
            SUM(CASE WHEN lt.name = 'STORE' THEN i.quantity_on_hand ELSE 0 END) AS store_on_hand,
            COALESCE(MAX(tr.in_transit), 0) AS in_transit,
            SUM(i.quantity_on_hand) + COALESCE(MAX(tr.in_transit), 0) AS network_total,
            ROUND((SUM(i.quantity_on_hand) + COALESCE(MAX(tr.in_transit), 0)) * p.list_price, 2) AS network_value,
            COUNT(CASE WHEN lt.name = 'STORE' AND i.quantity_on_hand > 0 THEN 1 END) AS stores_stocking_it
        FROM inventory i
        JOIN product p ON p.product_id = i.product_id
        JOIN unit_of_measure u ON u.uom_id = p.uom_id
        JOIN location l ON l.location_id = i.location_id
        JOIN location_type lt ON lt.location_type_id = l.location_type_id
        LEFT JOIN (
            SELECT tl.product_id,
                   SUM(tl.quantity_shipped - tl.quantity_received) AS in_transit
            FROM transfer_line tl
            JOIN transfer_order t ON t.transfer_order_id = tl.transfer_order_id
            JOIN status st ON st.status_id = t.status_id
            WHERE st.code = 'IN_TRANSIT'
            GROUP BY tl.product_id
        ) tr ON tr.product_id = i.product_id
        GROUP BY p.product_id, p.name, u.code, p.list_price
        ORDER BY network_value DESC
        LIMIT :limit;