from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.base import Base


class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)

    destination_id = Column(
        Integer,
        ForeignKey("destinations.id"),
        nullable=False,
    )

    name = Column(String(150), nullable=False)
    category = Column(String(50))
    description = Column(Text)
    estimated_cost = Column(Float, default=0)
    duration = Column(String(50))

    destination = relationship(
        "Destination",
        back_populates="activities",
    )
