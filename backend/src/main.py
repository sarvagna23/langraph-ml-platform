from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import uuid
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import engine, get_db
from models import Base, Experiment, Run
from schemas import ExperimentCreate, ExperimentResponse, RunCreate, RunResponse
from agents import build_analysis_graph

Base.metadata.create_all(bind=engine)

app = FastAPI(title="LangGraph ML Platform", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_analysis_graph()

@app.get("/health")
def health():
    return {"status": "ok", "service": "LangGraph ML Platform"}

@app.post("/experiments", response_model=ExperimentResponse)
def create_experiment(exp: ExperimentCreate, db: Session = Depends(get_db)):
    experiment = Experiment(
        id=str(uuid.uuid4()),
        name=exp.name,
        description=exp.description
    )
    db.add(experiment)
    db.commit()
    db.refresh(experiment)
    return experiment

@app.get("/experiments", response_model=list[ExperimentResponse])
def get_experiments(db: Session = Depends(get_db)):
    return db.query(Experiment).all()

@app.get("/experiments/{experiment_id}", response_model=ExperimentResponse)
def get_experiment(experiment_id: str, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    return exp

@app.post("/runs", response_model=RunResponse)
def create_run(run: RunCreate, db: Session = Depends(get_db)):
    db_run = Run(
        id=str(uuid.uuid4()),
        **run.model_dump()
    )
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run

@app.get("/runs", response_model=list[RunResponse])
def get_runs(experiment_id: str = None, db: Session = Depends(get_db)):
    query = db.query(Run)
    if experiment_id:
        query = query.filter(Run.experiment_id == experiment_id)
    return query.all()

@app.post("/experiments/{experiment_id}/analyze")
def analyze_experiment(experiment_id: str, db: Session = Depends(get_db)):
    exp = db.query(Experiment).filter(Experiment.id == experiment_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Experiment not found")
    
    runs = db.query(Run).filter(Run.experiment_id == experiment_id).all()
    if not runs:
        raise HTTPException(status_code=400, detail="No runs found for this experiment")
    
    runs_data = [
        {
            "model_name": r.model_name,
            "accuracy": r.accuracy,
            "loss": r.loss,
            "f1_score": r.f1_score
        }
        for r in runs
    ]
    
    result = graph.invoke({
        "experiment_name": exp.name,
        "runs": runs_data,
        "analysis": None,
        "recommendations": None,
        "best_model": None
    })
    
    return {
        "experiment_id": experiment_id,
        "best_model": result["best_model"],
        "analysis": result["analysis"],
        "recommendations": result["recommendations"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)