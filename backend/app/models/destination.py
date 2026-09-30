from sqlalchemy import Column, Float, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Destination(Base):
    __tablename__ = "destinations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    slug = Column(String(150), unique=True, nullable=False, index=True)
    county = Column(String(100), nullable=False)
    region = Column(String(100))
    description = Column(Text, nullable=False)
    tagline = Column(String(255))
    estimated_daily_cost = Column(Float)

    activities = relationship(
        "Activity",
        back_populates="destination",
        cascade="all, delete-orphan",
    )