from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date

from models import Carrier, Product

def get_carrier(db: Session, carrier_id: int):
    return db.query(Carrier).filter(Carrier.carrier_id == carrier_id).first()
    # db.query = SELECT*FROM TABLE (Item is the table object)
    # Filter is the WHERE part in the statement, matching the requested to the db.
    # first is the LIMIT function. (just returns the first result.)


def get_carriers(db: Session):
    return db.query(Carrier).all()

def create_carrier(db: Session, name: str, code: str, contact_phone: str):
    db_carrier = Carrier(name=name, code=code, contact_phone=contact_phone)
    db.add(db_carrier)
    db.commit()
    db.refresh(db_carrier)
    return db_carrier

def update_carrier(db: Session, carrier_id: int, name: str, code: str, contact_phone: str):
    carrier = get_carrier(db, carrier_id)
    if carrier:
        carrier.name = name
        carrier.code = code
        carrier.contact_phone = contact_phone
        db.commit()
        db.refresh(carrier)

def delete_carrier(db: Session, carrier_id: int):
    carrier = get_carrier(db, carrier_id)
    if carrier:
        db.delete(carrier)
        db.commit()
    return carrier

def get_product(db: Session, product_id: int):
    return db.query(Product).filter(Product.product_id == product_id).first()

def get_products(db: Session):
    return db.query(Product).all()

def get_product_by_name(db: Session, query: str):
    return db.query(Product).filter(Product.name.ilike(f"%{query}%")).limit(25).all()

def create_product(db: Session, name: str, sku: str, uom_id: int, list_price: float=None):
    db_product = Product(name=name, sku=sku, uom_id=uom_id, list_price=list_price)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

def get_network_inventory_position( db: Session, limit: int = 15):

    query = text(
        """
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
    """)
    result = db.execute(query, {"limit": limit})
    return result.mappings().all

def get_replenishment_reccommendations(db: Session, as_of_date: date):
    query = text(
        """
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
    """)
    result = db.execute(query, {"as_of_date": as_of_date})
    return result.mappings().all

# HUGE NOTE:
#   THIS IS SOMETHING IM LEARNING NEW, BUT AFTER WE
#   GET THE DATA BACK, BECAUSE ITS NOT THROUGH THE
#   ORM DIRECTLY 
#   
#