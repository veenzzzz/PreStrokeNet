from pydantic import BaseModel, Field


class KeystrokeFeatures(BaseModel):
    key: int = Field(ge=0)
    H: float = Field(ge=0)
    UD: float = Field(ge=0)
    DD: float = Field(ge=0)
