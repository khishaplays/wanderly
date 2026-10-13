from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, selectinload

from app.database import get_db
from app.models.destination import Destination
from app.schemas.destination import (
    DestinationResponse,
    DestinationDetailResponse,
)

router = APIRouter(
    prefix="/api/destinations",
    tags=["Destinations"],
)


@router.get("", response_model=list[DestinationResponse])
def get_destinations(db: Session = Depends(get_db)):
    return db.query(Destination).all()


@router.get(
    "/{destination_id}",
    response_model=DestinationDetailResponse,
)
def get_destination(
    destination_id: int,
    db: Session = Depends(get_db),
):
    destination = (
        db.query(Destination)
        .options(selectinload(Destination.activities))
        .filter(Destination.id == destination_id)
        .first()
    )

    if destination is None:
        raise HTTPException(
            status_code=404,
            detail="Destination not found",
        )

    return destination