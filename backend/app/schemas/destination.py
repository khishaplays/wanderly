from pydantic import BaseModel, ConfigDict


class ActivityResponse(BaseModel):
    id: int
    destination_id: int
    name: str
    category: str | None = None
    description: str | None = None
    estimated_cost: float | None = None
    duration: str | None = None

    model_config = ConfigDict(from_attributes=True)


class DestinationResponse(BaseModel):
    id: int
    name: str
    slug: str
    county: str
    region: str | None = None
    description: str
    tagline: str | None = None
    estimated_daily_cost: float | None = None

    model_config = ConfigDict(from_attributes=True)


class DestinationDetailResponse(DestinationResponse):
    activities: list[ActivityResponse]