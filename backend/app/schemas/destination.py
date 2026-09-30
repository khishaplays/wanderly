from pydantic import BaseModel, ConfigDict


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