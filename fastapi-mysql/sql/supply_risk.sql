WITH purchased AS (
    SELECT rl.product_id, SUM(rl.quantity_received * pl.unit_cost) AS spend
    FROM receipt_line rl
    JOIN po_line pl ON pl.po_id = rl.po_id AND pl.product_id = rl.product_id
    GROUP BY rl.product_id
),
backup AS (
    SELECT ps.product_id, ps.supplier_id, ps.supplier_price, ps.lead_time_days,
           ROW_NUMBER() OVER (PARTITION BY ps.product_id
                              ORDER BY ps.supplier_price, ps.supplier_id) AS rn
    FROM product_supplier ps
    WHERE ps.is_preferred = 0
)
SELECT
    p.product_id,
    p.name                                                       AS product,
    dept.name                                                    AS department,
    sp.name                                                      AS preferred_supplier,
    COALESCE(sb.name, '(none)')                                  AS backup_supplier,
    ROUND(100 * (bk.supplier_price - pref.supplier_price)
              / pref.supplier_price, 1)                          AS backup_premium_pct,
    bk.lead_time_days - pref.lead_time_days                      AS backup_extra_lead_days,
    CASE WHEN bk.product_id IS NULL THEN (
        SELECT COUNT(DISTINCT ps2.supplier_id)
        FROM product_supplier ps2
        JOIN product p2          ON p2.product_id  = ps2.product_id
        JOIN product_category c2 ON c2.category_id = p2.category_id
        WHERE COALESCE(c2.parent_category_id, c2.category_id) = dept.category_id
          AND ps2.supplier_id <> pref.supplier_id
          AND NOT EXISTS (SELECT 1 FROM product_supplier x
                          WHERE x.product_id  = p.product_id
                            AND x.supplier_id = ps2.supplier_id)
    ) END                                                        AS backup_candidates_in_dept,
    ROUND(pu.spend, 2)                                           AS received_spend,
    CASE
        WHEN bk.product_id IS NULL THEN 'High: single source'
        WHEN (bk.supplier_price - pref.supplier_price) / pref.supplier_price > 0.10
            THEN 'Medium: backup over 10% dearer'
        ELSE 'Low'
    END                                                          AS risk_level
FROM purchased pu
JOIN product p              ON p.product_id   = pu.product_id
JOIN product_category c     ON c.category_id  = p.category_id
JOIN product_category dept  ON dept.category_id = COALESCE(c.parent_category_id, c.category_id)
JOIN product_supplier pref  ON pref.product_id = p.product_id AND pref.is_preferred = 1
JOIN supplier sp            ON sp.supplier_id  = pref.supplier_id
LEFT JOIN backup bk         ON bk.product_id   = p.product_id AND bk.rn = 1
LEFT JOIN supplier sb       ON sb.supplier_id  = bk.supplier_id
ORDER BY pu.spend DESC
LIMIT 15;
