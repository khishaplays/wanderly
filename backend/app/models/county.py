from sqlalchemy import CheckConstraint, Column, Index, Integer, String, func
from sqlalchemy.orm import relationship

from app.base import Base


class County(Base):
    __tablename__ = "counties"
    __table_args__ = (
        CheckConstraint(
            "code IN ("
            "'001', '002', '003', '004', '005', '006', '007', '008', '009', '010', "
            "'011', '012', '013', '014', '015', '016', '017', '018', '019', '020', "
            "'021', '022', '023', '024', '025', '026', '027', '028', '029', '030', "
            "'031', '032', '033', '034', '035', '036', '037', '038', '039', '040', "
            "'041', '042', '043', '044', '045', '046', '047')",
            name="ck_counties_official_code",
        ),
        CheckConstraint("length(trim(name)) > 0", name="ck_counties_name_nonempty"),
        CheckConstraint("length(trim(slug)) > 0 AND slug = lower(trim(slug))",
                        name="ck_counties_slug_normalized"),
    )

    id = Column(Integer, primary_key=True)
    code = Column(String(3), nullable=False, unique=True)
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False, unique=True)

    # No delete/delete-orphan cascade. County deletion cannot remove listings.
    destinations = relationship(
        "Destination", back_populates="county_record", passive_deletes="all"
    )


Index("uq_counties_normalized_name", func.lower(func.trim(County.name)), unique=True)
