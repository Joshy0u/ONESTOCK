from sqlalchemy.orm import Session
from models import Carrier

def get_carrier(db: Session, carrier_id: int):
    return db.query(Carrier).filter(Carrier.id == carrier_id).first()
    # db.query = SELECT*FROM TABLE (Item is the table object)
    # Filter is the WHERE part in the statement, matching the requested to the db.
    # first is the LIMIT function. (just returns the first result.)


def create_carrier(db: Session, name: str, code: str, contact_phone: str):
    db_carrier = Carrier(name=name, code=code, contact_phone=contact_phone)
    db.add(db_carrier)
    db.commit()
    db.refresh(db_carrier)
    return db_carrier