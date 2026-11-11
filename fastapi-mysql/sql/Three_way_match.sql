SELECT *
FROM (
    SELECT
        po.po_id,
        s.name                                         AS supplier,
        st.code                                        AS po_status,
        ROUND(ordv.value_ordered, 2)                   AS value_ordered,
        ROUND(COALESCE(rcvv.value_received, 0), 2)     AS value_received,
        ROUND(COALESCE(ledg.value_posted, 0), 2)       AS value_posted_to_ledger,
        ROUND(ordv.value_ordered - COALESCE(rcvv.value_received, 0), 2) AS value_still_open,
        CASE
            WHEN st.code = 'CANCELLED'
                THEN 'Cancelled'
            WHEN ROUND(COALESCE(rcvv.value_received, 0), 2)
              <> ROUND(COALESCE(ledg.value_posted, 0), 2)
                THEN 'MISMATCH'
            WHEN COALESCE(rcvv.value_received, 0) = 0
                THEN 'Not received yet'
            WHEN ROUND(rcvv.value_received, 2) < ROUND(ordv.value_ordered, 2)
                THEN 'Partial - matched so far'
            ELSE 'Fully matched'
        END                                            AS match_status
    FROM purchase_order po
    JOIN supplier s ON s.supplier_id = po.supplier_id
    JOIN status st  ON st.status_id  = po.status_id
    JOIN (
        SELECT po_id, SUM(quantity_ordered * unit_cost) AS value_ordered
        FROM po_line
        GROUP BY po_id
    ) ordv ON ordv.po_id = po.po_id
    LEFT JOIN (
        SELECT rl.po_id, SUM(rl.quantity_received * pl.unit_cost) AS value_received
        FROM receipt_line rl
        JOIN po_line pl ON pl.po_id      = rl.po_id
                       AND pl.product_id = rl.product_id
        GROUP BY rl.po_id
    ) rcvv ON rcvv.po_id = po.po_id
    LEFT JOIN (
        SELECT ref_doc_id AS po_id, SUM(amount) AS value_posted
        FROM financial_transaction
        WHERE ref_doc_type = 'PO'
        GROUP BY ref_doc_id
    ) ledg ON ledg.po_id = po.po_id
) m
ORDER BY CASE m.match_status
             WHEN 'MISMATCH'                 THEN 1
             WHEN 'Partial - matched so far' THEN 2
             WHEN 'Not received yet'         THEN 3
             WHEN 'Cancelled'                THEN 4
             ELSE 5
         END,
         m.po_id;