import { useEffect, useState } from 'react';
import DarkCard from '../components/DarkCard.tsx';
import StatusPill from '../components/StatusPill.tsx';
import { gatewayApi } from '../lib/api.ts';
import type { GatewayHealth, GatewayRequest, ProviderStatus } from '../types.ts';

const MOCK_HEALTH: GatewayHealth = {
  status: 'healthy',
  uptimePct: 99.8,
  requestsPerMin: 142,
  avgLatencyMs: 87,
  errorRate: 0.4,
};

const MOCK_REQUESTS: GatewayRequest[] = [
  { id: '1', timestamp: '2025-05-20T14:32:01Z', method: 'POST', path: '/v1/chat/completions', statusCode: 200, latencyMs: 1240, provider: 'openai' },
  { id: '2', timestamp: '2025-05-20T14:31:55Z', method: 'POST', path: '/v1/messages', statusCode: 200, latencyMs: 890, provider: 'anthropic' },
  { id: '3', timestamp: '2025-05-20T14:31:48Z', method: 'POST', path: '/v1/chat/completions', statusCode: 429, latencyMs: 45, provider: 'openai' },
  { id: '4', timestamp: '2025-05-20T14:31:40Z', method: 'GET', path: '/health', statusCode: 200, latencyMs: 4, provider: 'internal' },
  { id: '5', timestamp: '2025-05-20T14:31:32Z', method: 'POST', path: '/v1/messages', statusCode: 200, latencyMs: 1050, provider: 'anthropic' },
];

const MOCK_PROVIDERS: ProviderStatus[] = [
  { name: 'OpenAI', status: 'online', latencyMs: 1150, requestsToday: 2840 },
  { name: 'Anthropic', status: 'online', latencyMs: 980, requestsToday: 1620 },
  { name: 'Azure OpenAI', status: 'degraded', latencyMs: 2400, requestsToday: 310 },
];

export default function GatewayPage() {
  const [health, setHealth] = useState<GatewayHealth>(MOCK_HEALTH);
  const [requests, setRequests] = useState<GatewayRequest[]>(MOCK_REQUESTS);
  const [providers, setProviders] = useState<ProviderStatus[]>(MOCK_PROVIDERS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      gatewayApi.get<GatewayHealth>('/health'),
      gatewayApi.get<GatewayRequest[]>('/requests/recent'),
      gatewayApi.get<ProviderStatus[]>('/providers'),
    ])
      .then(([h, r, p]) => {
        setHealth(h);
        setRequests(r);
        setProviders(p);
      })
      .catch(() => {
        setError('API unavailable — showing demo data.');
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Gateway</h1>
      <p className="text-slate-400 text-sm mb-6">fullstack-gateway health and request log</p>

      {error && (
        <div className="mb-5 text-sm bg-yellow-900/40 border border-yellow-700 text-yellow-300 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <DarkCard>
          <p className="text-xs text-slate-400 mb-1">Status</p>
          <StatusPill status={health.status} />
        </DarkCard>
        <DarkCard>
          <p className="text-xs text-slate-400 mb-1">Uptime</p>
          <p className="text-xl font-bold text-slate-100">{health.uptimePct}%</p>
        </DarkCard>
        <DarkCard>
          <p className="text-xs text-slate-400 mb-1">Req/min</p>
          <p className="text-xl font-bold text-slate-100">{health.requestsPerMin}</p>
        </DarkCard>
        <DarkCard>
          <p className="text-xs text-slate-400 mb-1">Avg Latency</p>
          <p className="text-xl font-bold text-slate-100">{health.avgLatencyMs}ms</p>
        </DarkCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {providers.map((p) => (
          <DarkCard key={p.name}>
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-slate-200 text-sm">{p.name}</p>
              <StatusPill status={p.status} />
            </div>
            <p className="text-xs text-slate-500">{p.latencyMs}ms avg &bull; {p.requestsToday.toLocaleString()} req today</p>
          </DarkCard>
        ))}
      </div>

      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Recent Requests</h2>
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-900/50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Method</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Path</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Provider</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Latency</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-2.5 text-slate-400 text-xs font-mono">{r.timestamp.replace('T', ' ').replace('Z', '')}</td>
                <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{r.method}</td>
                <td className="px-4 py-2.5 text-slate-300 font-mono text-xs">{r.path}</td>
                <td className="px-4 py-2.5 text-slate-400 text-xs capitalize">{r.provider}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className={`text-xs font-mono font-semibold ${r.statusCode < 400 ? 'text-green-400' : r.statusCode < 500 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {r.statusCode}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right text-slate-400 text-xs">{r.latencyMs}ms</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
