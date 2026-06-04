import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const API = 'http://localhost:8000';

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: string;
  created_at: string;
}

interface Run {
  id: string;
  experiment_id: string;
  model_name: string;
  accuracy: number;
  loss: number;
  f1_score: number;
  parameters: any;
  created_at: string;
}

interface Analysis {
  best_model: string;
  analysis: string;
  recommendations: string;
}

function App() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExp, setSelectedExp] = useState<Experiment | null>(null);
  const [runs, setRuns] = useState<Run[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [newExp, setNewExp] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    const res = await axios.get(`${API}/experiments`);
    setExperiments(res.data);
  };

  const fetchRuns = async (expId: string) => {
    const res = await axios.get(`${API}/runs?experiment_id=${expId}`);
    setRuns(res.data);
  };

  const selectExperiment = async (exp: Experiment) => {
    setSelectedExp(exp);
    setAnalysis(null);
    await fetchRuns(exp.id);
  };

  const createExperiment = async () => {
    if (!newExp.name) return;
    await axios.post(`${API}/experiments`, newExp);
    setNewExp({ name: '', description: '' });
    fetchExperiments();
  };

  const analyzeExperiment = async () => {
    if (!selectedExp) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/experiments/${selectedExp.id}/analyze`);
      setAnalysis(res.data);
    } finally {
      setLoading(false);
    }
  };

  const chartData = runs.map(r => ({
    name: r.model_name,
    accuracy: +(r.accuracy * 100).toFixed(2),
    loss: +r.loss.toFixed(4),
    f1: +(r.f1_score * 100).toFixed(2)
  }));

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      <h1 style={{ color: '#1a1a2e', borderBottom: '3px solid #4f46e5', paddingBottom: 10 }}>
        🧪 LangGraph ML Platform
      </h1>
      <p style={{ color: '#666' }}>ML Experiment Tracking powered by LangGraph AI Agents</p>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20, marginTop: 20 }}>
        {/* Left Panel */}
        <div>
          <div style={{ background: '#f8f9fa', padding: 15, borderRadius: 8, marginBottom: 15 }}>
            <h3>New Experiment</h3>
            <input
              placeholder="Experiment name"
              value={newExp.name}
              onChange={e => setNewExp({...newExp, name: e.target.value})}
              style={{ width: '100%', padding: 8, marginBottom: 8, borderRadius: 4, border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
            <input
              placeholder="Description"
              value={newExp.description}
              onChange={e => setNewExp({...newExp, description: e.target.value})}
              style={{ width: '100%', padding: 8, marginBottom: 8, borderRadius: 4, border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
            <button
              onClick={createExperiment}
              style={{ width: '100%', padding: 8, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
            >
              Create Experiment
            </button>
          </div>

          <h3>Experiments</h3>
          {experiments.map(exp => (
            <div
              key={exp.id}
              onClick={() => selectExperiment(exp)}
              style={{
                padding: 12, marginBottom: 8, borderRadius: 6, cursor: 'pointer',
                background: selectedExp?.id === exp.id ? '#4f46e5' : '#fff',
                color: selectedExp?.id === exp.id ? 'white' : '#333',
                border: '1px solid #ddd'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>{exp.name}</div>
              <div style={{ fontSize: 12, opacity: 0.7 }}>{exp.status}</div>
            </div>
          ))}
        </div>

        {/* Right Panel */}
        <div>
          {selectedExp ? (
            <>
              <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd', marginBottom: 20 }}>
                <h2>{selectedExp.name}</h2>
                <p style={{ color: '#666' }}>{selectedExp.description}</p>
                <button
                  onClick={analyzeExperiment}
                  disabled={loading || runs.length === 0}
                  style={{
                    padding: '10px 20px', background: loading ? '#ccc' : '#10b981',
                    color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer'
                  }}
                >
                  {loading ? '🤖 Analyzing...' : '🤖 Analyze with LangGraph'}
                </button>
              </div>

              {runs.length > 0 && (
                <>
                  <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd', marginBottom: 20 }}>
                    <h3>Model Performance</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="accuracy" fill="#4f46e5" name="Accuracy %" />
                        <Bar dataKey="f1" fill="#10b981" name="F1 Score %" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd', marginBottom: 20 }}>
                    <h3>Loss Comparison</h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="loss" fill="#ef4444" name="Loss" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '1px solid #ddd', marginBottom: 20 }}>
                    <h3>Runs ({runs.length})</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8f9fa' }}>
                          <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid #ddd' }}>Model</th>
                          <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid #ddd' }}>Accuracy</th>
                          <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid #ddd' }}>Loss</th>
                          <th style={{ padding: 8, textAlign: 'left', borderBottom: '1px solid #ddd' }}>F1</th>
                        </tr>
                      </thead>
                      <tbody>
                        {runs.map(run => (
                          <tr key={run.id}>
                            <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{run.model_name}</td>
                            <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{(run.accuracy * 100).toFixed(2)}%</td>
                            <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{run.loss.toFixed(4)}</td>
                            <td style={{ padding: 8, borderBottom: '1px solid #eee' }}>{run.f1_score ? (run.f1_score * 100).toFixed(2) + '%' : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {analysis && (
                <div style={{ background: '#fff', padding: 20, borderRadius: 8, border: '2px solid #10b981', marginBottom: 20 }}>
                  <h3>🤖 LangGraph Analysis</h3>
                  <div style={{ background: '#f0fdf4', padding: 12, borderRadius: 6, marginBottom: 12 }}>
                    <strong>Best Model: {analysis.best_model}</strong>
                  </div>
                  <h4>Analysis</h4>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#333' }}>{analysis.analysis}</pre>
                  <h4>Recommendations</h4>
                  <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#333' }}>{analysis.recommendations}</pre>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
              <h3>Select an experiment to view details</h3>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;