from sqlalchemy import Column, Integer, String
from database import Base

class Carrier(Base): #mapping the classes maybe to the table exactly? its turing the table into an object.
    __tablename__ = "carrier"
    
    carrier_id = Column(Integer, primary_key=True, nullable=False) # autoincrement is handled by alchemy?
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    contact_phone = Column(String(20))




