from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date
from pathlib import Path

from models import Carrier, Product

# UTILITY FUNCTION
def load_sql_query(filename: str) -> str:
    path = Path(__file__).parent / "sql" / filename
    return path.read_text(encoding="utf-8")

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

    query_text = load_sql_query("network_position.sql")
    result = db.execute(text(query_text), {"limit": limit})
    return [dict(row) for row in result.mappings().all()]
#[dict(row) for row in result.mappings().all()]


# HUGE NOTE:
#   THIS IS SOMETHING IM LEARNING NEW, BUT AFTER WE
#   GET THE DATA BACK, BECAUSE ITS NOT THROUGH THE
#   ORM DIRECTLY 

def get_aging_stock(db: Session, as_of_date: date):
    query_text = load_sql_query("aging_stock.sql")
    result = db.execute(text(query_text), {"as_of_date": as_of_date})
    return [dict(row) for row in result.mappings().all()]

def get_product_demand(db: Session):
    query_text = load_sql_query("product_demand.sql")
    result = db.execute(text(query_text))
    return [dict(row) for row in result.mappings().all()]

def get_backlog(db: Session, as_of_date: date):
    query_text = load_sql_query("purchase_backlog.sql")
    result = db.execute(text(query_text), {"as_of_date": as_of_date})
    return [dict(row) for row in result.mappings().all()]

def get_replenishment_reccommendations(db: Session, as_of_date: date):
    query_text = load_sql_query("replentish_recs.sql")
    result = db.execute(text(query_text), {"as_of_date": as_of_date})
    return result.mappings().all()