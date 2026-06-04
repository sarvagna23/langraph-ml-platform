from sqlalchemy import Column, String, Float, Integer, DateTime, Text, JSON
from datetime import datetime
from database import Base

class Experiment(Base):
    __tablename__ = "experiments"
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="running")
    created_at = Column(DateTime, default=datetime.utcnow)

class Run(Base):
    __tablename__ = "runs"
    id = Column(String, primary_key=True)
    experiment_id = Column(String, nullable=False)
    model_name = Column(String)
    accuracy = Column(Float)
    loss = Column(Float)
    precision = Column(Float)
    recall = Column(Float)
    f1_score = Column(Float)
    parameters = Column(JSON)
    status = Column(String, default="completed")
    created_at = Column(DateTime, default=datetime.utcnow)