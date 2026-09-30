from flask import Blueprint

from app.models import Destination


destinations_bp = Blueprint(
    "destinations",
    __name__,
    url_prefix="/api/destinations",
)


@destinations_bp.get("")
def get_destinations():
    destinations = Destination.query.all()

    return {
        "destinations": [
            destination.to_dict()
            for destination in destinations
        ]
    }


@destinations_bp.get("/<int:destination_id>")
def get_destination(destination_id):
    destination = Destination.query.get_or_404(destination_id)

    return destination.to_dict()