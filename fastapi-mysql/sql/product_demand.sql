WITH product_spend AS (
    SELECT
        p.product_id,
        SUM(rl.quantity_received * pl.unit_cost) AS spend
    FROM receipt_line rl
    JOIN po_line pl ON pl.po_id      = rl.po_id
                   AND pl.product_id = rl.product_id
    JOIN product p  ON p.product_id  = rl.product_id
    GROUP BY p.product_id
),
ranked AS (
    SELECT
        product_id,
        spend,
        SUM(spend) OVER (ORDER BY spend DESC, product_id) AS running_spend,
        SUM(spend) OVER ()                                AS total_spend
    FROM product_spend
),
classified AS (
    SELECT
        product_id,
        spend,
        CASE
            WHEN running_spend / total_spend <= 0.80 THEN 'A'
            WHEN running_spend / total_spend <= 0.95 THEN 'B'
            ELSE 'C'
        END AS abc_class
    FROM ranked
)
SELECT
    abc_class,
    COUNT(*)                                             AS products,
    ROUND(100 * COUNT(*) / SUM(COUNT(*)) OVER (), 1)     AS pct_of_products,
    ROUND(SUM(spend), 2)                                 AS spend,
    ROUND(100 * SUM(spend) / SUM(SUM(spend)) OVER (), 1) AS pct_of_spend
FROM classified
GROUP BY abc_class
ORDER BY abc_class;