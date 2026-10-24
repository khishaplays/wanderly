from pydantic import BaseModel, ConfigDict


class CountyResponse(BaseModel):
    id: int
    code: str
    name: str
    slug: str

    model_config = ConfigDict(from_attributes=True)
