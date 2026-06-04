from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class ExperimentCreate(BaseModel):
    name: str
    description: Optional[str] = None

class ExperimentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str]
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class RunCreate(BaseModel):
    experiment_id: str
    model_name: str
    accuracy: float
    loss: float
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1_score: Optional[float] = None
    parameters: Optional[Dict[str, Any]] = None

class RunResponse(BaseModel):
    id: str
    experiment_id: str
    model_name: str
    accuracy: float
    loss: float
    precision: Optional[float]
    recall: Optional[float]
    f1_score: Optional[float]
    parameters: Optional[Dict[str, Any]]
    status: str
    created_at: datetime
    class Config:
        from_attributes = True