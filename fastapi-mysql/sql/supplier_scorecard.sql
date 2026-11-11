WITH received AS (
    SELECT po_id, product_id, SUM(quantity_received) AS qty
    FROM receipt_line
    GROUP BY po_id, product_id
),
po_stats AS (
    SELECT
        po.po_id,
        po.supplier_id,
        po.order_date,
        po.expected_date,
        (SELECT MIN(r.received_date) FROM receipt r WHERE r.po_id = po.po_id) AS first_received,
        SUM(pl.quantity_ordered * pl.unit_cost)                               AS value_ordered,
        SUM(COALESCE(rc.qty, 0) * pl.unit_cost)                               AS value_received
    FROM purchase_order po
    JOIN status st  ON st.status_id = po.status_id
    JOIN po_line pl ON pl.po_id     = po.po_id
    LEFT JOIN received rc ON rc.po_id = pl.po_id AND rc.product_id = pl.product_id
    WHERE st.code NOT IN ('DRAFT', 'CANCELLED')
      AND po.expected_date <= :as_of_date
    GROUP BY po.po_id, po.supplier_id, po.order_date, po.expected_date
)
SELECT *
FROM (
SELECT
    t.*,
    CASE
        WHEN t.pos_delivered < t.pos_due AND t.fill_rate_pct < 80 THEN 'Act now'   -- overdue orders, nothing or little arrived
        WHEN t.avg_days_late >= 3 OR t.fill_rate_pct < 80         THEN 'Act now'
        WHEN t.avg_days_late > 0  OR t.fill_rate_pct < 100        THEN 'Watch'
        ELSE 'Reliable'
    END AS rating
FROM (
    SELECT
        s.name                                                              AS supplier,
        COUNT(*)                                                            AS pos_due,
        SUM(ps.first_received IS NOT NULL)                                  AS pos_delivered,
        ROUND(100 * AVG(CASE WHEN ps.first_received IS NOT NULL
                             THEN ps.first_received <= ps.expected_date END), 1) AS on_time_pct,
        ROUND(100 * SUM(ps.value_received) / SUM(ps.value_ordered), 1)      AS fill_rate_pct,
        ROUND(AVG(DATEDIFF(ps.expected_date, ps.order_date)), 1)            AS promised_lead_days,
        ROUND(AVG(DATEDIFF(ps.first_received, ps.order_date)), 1)           AS actual_lead_days,
        ROUND(AVG(GREATEST(DATEDIFF(ps.first_received, ps.expected_date), 0)), 1) AS avg_days_late
    FROM po_stats ps
    JOIN supplier s ON s.supplier_id = ps.supplier_id
    GROUP BY s.supplier_id, s.name
) t
) r
ORDER BY FIELD(r.rating, 'Act now', 'Watch', 'Reliable'), r.on_time_pct, r.fill_rate_pct;