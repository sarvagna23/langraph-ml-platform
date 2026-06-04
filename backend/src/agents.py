from langgraph.graph import StateGraph, END
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from typing import TypedDict, Optional, List
import os
from dotenv import load_dotenv

load_dotenv()

llm = ChatAnthropic(
    model="claude-sonnet-4-5",
    anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
)

class AnalysisState(TypedDict):
    experiment_name: str
    runs: List[dict]
    analysis: Optional[str]
    recommendations: Optional[str]
    best_model: Optional[str]

def analyze_runs(state: AnalysisState) -> AnalysisState:
    print("[Agent] Analyzing experiment runs...")
    runs_summary = "\n".join([
        f"- {r['model_name']}: accuracy={r['accuracy']:.4f}, loss={r['loss']:.4f}, f1={r.get('f1_score', 'N/A')}"
        for r in state['runs']
    ])
    messages = [
        SystemMessage(content="You are an ML experiment analyzer. Analyze model runs and provide insights."),
        HumanMessage(content=f"Experiment: {state['experiment_name']}\n\nRuns:\n{runs_summary}\n\nAnalyze these results and identify trends.")
    ]
    response = llm.invoke(messages)
    return {**state, "analysis": response.content}

def recommend_improvements(state: AnalysisState) -> AnalysisState:
    print("[Agent] Generating recommendations...")
    messages = [
        SystemMessage(content="You are an ML optimization expert. Suggest improvements based on experiment analysis."),
        HumanMessage(content=f"Analysis:\n{state['analysis']}\n\nProvide 3 specific actionable recommendations to improve model performance.")
    ]
    response = llm.invoke(messages)
    
    # Find best model
    best = max(state['runs'], key=lambda x: x['accuracy'])
    
    return {
        **state,
        "recommendations": response.content,
        "best_model": best['model_name']
    }

def build_analysis_graph():
    graph = StateGraph(AnalysisState)
    graph.add_node("analyze", analyze_runs)
    graph.add_node("recommend", recommend_improvements)
    graph.set_entry_point("analyze")
    graph.add_edge("analyze", "recommend")
    graph.add_edge("recommend", END)
    return graph.compile()

if __name__ == "__main__":
    graph = build_analysis_graph()
    result = graph.invoke({
        "experiment_name": "XGBoost vs Random Forest",
        "runs": [
            {"model_name": "XGBoost", "accuracy": 0.9484, "loss": 0.12, "f1_score": 0.94},
            {"model_name": "RandomForest", "accuracy": 0.9201, "loss": 0.18, "f1_score": 0.91},
            {"model_name": "LogisticRegression", "accuracy": 0.8756, "loss": 0.25, "f1_score": 0.87},
        ],
        "analysis": None,
        "recommendations": None,
        "best_model": None
    })
    print(f"\nBest Model: {result['best_model']}")
    print(f"\nAnalysis: {result['analysis'][:300]}...")
    print(f"\nRecommendations: {result['recommendations'][:300]}...")