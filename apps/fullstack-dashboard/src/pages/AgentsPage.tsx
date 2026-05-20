import { useEffect, useState } from 'react';
import DarkCard from '../components/DarkCard.tsx';
import StatusPill from '../components/StatusPill.tsx';
import { gatewayApi } from '../lib/api.ts';
import type { Agent } from '../types.ts';

const MOCK: Agent[] = [
  { name: 'swarm-01', role: 'orchestrator', status: 'active', lastSeen: '2025-05-20T14:32:00Z', tasksCompleted: 142 },
  { name: 'swarm-02', role: 'data-ingestion', status: 'active', lastSeen: '2025-05-20T14:31:50Z', tasksCompleted: 89 },
  { name: 'swarm-03', role: 'frontend-builder', status: 'active', lastSeen: '2025-05-20T14:31:45Z', tasksCompleted: 34 },
  { name: 'swarm-04', role: 'reviewer', status: 'idle', lastSeen: '2025-05-20T14:20:00Z', tasksCompleted: 210 },
  { name: 'swarm-05', role: 'deployer', status: 'active', lastSeen: '2025-05-20T14:31:00Z', tasksCompleted: 58 },
  { name: 'swarm-06', role: 'tester', status: 'error', lastSeen: '2025-05-20T14:15:00Z', tasksCompleted: 77 },
  { name: 'swarm-07', role: 'notifier', status: 'stopped', lastSeen: '2025-05-20T10:00:00Z', tasksCompleted: 301 },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gatewayApi
      .get<Agent[]>('/agents')
      .then(setAgents)
      .catch(() => {
        setError('API unavailable — showing demo data.');
        setAgents(MOCK);
      })
      .finally(() => setLoading(false));
  }, []);

  const activeCount = agents.filter((a) => a.status === 'active').length;
  const errorCount = agents.filter((a) => a.status === 'error').length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Agents</h1>
      <p className="text-slate-400 text-sm mb-6">AiSquad worker status — {activeCount} active, {errorCount} errors</p>

      {error && (
        <div className="mb-5 text-sm bg-yellow-900/40 border border-yellow-700 text-yellow-300 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm py-12 text-center">Loading agents…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((agent) => (
            <DarkCard key={agent.name}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-semibold text-slate-100 font-mono text-sm">{agent.name}</p>
                <StatusPill status={agent.status} />
              </div>
              <p className="text-xs text-slate-400 capitalize mb-3">{agent.role.replace(/-/g, ' ')}</p>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Tasks done: <span className="text-slate-300 font-medium">{agent.tasksCompleted}</span></span>
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Last seen: {agent.lastSeen.replace('T', ' ').replace('Z', '')}
              </p>
            </DarkCard>
          ))}
        </div>
      )}
    </div>
  );
}
