from sqlalchemy import Column, Integer, String, DECIMAL, Text, ForeignKey
from database import Base

class Carrier(Base): #mapping the classes maybe to the table exactly? its turing the table into an object.
    __tablename__ = "carrier"
    
    carrier_id = Column(Integer, primary_key=True, nullable=False) # autoincrement is handled by alchemy?
    name = Column(String(100), nullable=False)
    code = Column(String(20), unique=True, nullable=False)
    contact_phone = Column(String(20))

class Product(Base):
    __tablename__ = "product"

    product_id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String(100), nullable=False)
    sku = Column(String(30), unique=True, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("product_category.category_id"), nullable=True)
    uom_id = Column(Integer, ForeignKey("unit_of_measure.uom_id"), nullable=False)
    list_price = Column(DECIMAL(10, 2), nullable=True)
    special_notes = Column(Text, nullable=True)


class Product_Category(Base):
    __tablename__ = "product_category"

    category_id = Column(Integer, primary_key=True, nullable=False, index=True)
    name = Column(String(50), nullable=False)
    parent_category_id = Column(Integer, ForeignKey("product_category.category_id"), nullable=True)

class UnitOfMeasure(Base):
    __tablename__ = "unit_of_measure"

    uom_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(10), unique=True, nullable=False)
    description = Column(String(50), nullable=True)



