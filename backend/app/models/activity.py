from app.extensions import db


class Activity(db.Model):
    __tablename__ = "activities"

    id = db.Column(db.Integer, primary_key=True)

    destination_id = db.Column(
        db.Integer,
        db.ForeignKey("destinations.id"),
        nullable=False,
    )

    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50))
    description = db.Column(db.Text)
    estimated_cost = db.Column(db.Float, default=0)
    duration = db.Column(db.String(50))

    def to_dict(self):
        return {
            "id": self.id,
            "destinationId": self.destination_id,
            "name": self.name,
            "category": self.category,
            "description": self.description,
            "estimatedCost": self.estimated_cost,
            "duration": self.duration,
        }