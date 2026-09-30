from app.extensions import db


class Destination(db.Model):
    __tablename__ = "destinations"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    slug = db.Column(db.String(150), unique=True, nullable=False)
    county = db.Column(db.String(100), nullable=False)
    region = db.Column(db.String(100))
    description = db.Column(db.Text, nullable=False)
    tagline = db.Column(db.String(255))
    estimated_daily_cost = db.Column(db.Float)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "slug": self.slug,
            "county": self.county,
            "region": self.region,
            "description": self.description,
            "tagline": self.tagline,
            "estimatedDailyCost": self.estimated_daily_cost,
        }