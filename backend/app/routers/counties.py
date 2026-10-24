from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.county import County
from app.schemas.county import CountyResponse


router = APIRouter(prefix="/api/counties", tags=["Counties"])


@router.get("", response_model=list[CountyResponse])
def get_counties(db: Session = Depends(get_db)):
    return db.query(County).order_by(County.code).all()


@router.get("/{county_slug}", response_model=CountyResponse)
def get_county(county_slug: str, db: Session = Depends(get_db)):
    county = db.query(County).filter(County.slug == county_slug).first()
    if county is None:
        raise HTTPException(status_code=404, detail="County not found")
    return county
