import { useEffect, useState } from 'react';
import StatusPill from '../components/StatusPill.tsx';
import { gatewayApi } from '../lib/api.ts';
import type { SecretHealth } from '../types.ts';

const MOCK: SecretHealth[] = [
  { name: 'openai-api-key', lastRotated: '2025-04-01', daysUntilExpiry: 42, status: 'ok' },
  { name: 'anthropic-api-key', lastRotated: '2025-05-01', daysUntilExpiry: 72, status: 'ok' },
  { name: 'azure-client-secret', lastRotated: '2025-03-15', daysUntilExpiry: 8, status: 'expiring-soon' },
  { name: 'db-connection-string', lastRotated: '2025-02-01', daysUntilExpiry: null, status: 'expired' },
  { name: 'jwt-signing-key', lastRotated: '2025-05-10', daysUntilExpiry: 81, status: 'ok' },
  { name: 'stripe-webhook-secret', lastRotated: '2025-04-20', daysUntilExpiry: 61, status: 'ok' },
  { name: 'sendgrid-api-key', lastRotated: '2025-03-01', daysUntilExpiry: 11, status: 'expiring-soon' },
];

export default function SecretsPage() {
  const [secrets, setSecrets] = useState<SecretHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    gatewayApi
      .get<SecretHealth[]>('/secrets/health')
      .then(setSecrets)
      .catch(() => {
        setError('API unavailable — showing demo data.');
        setSecrets(MOCK);
      })
      .finally(() => setLoading(false));
  }, []);

  const expiredCount = secrets.filter((s) => s.status === 'expired').length;
  const expiringSoonCount = secrets.filter((s) => s.status === 'expiring-soon').length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-2xl font-bold text-slate-100 mb-1">Secrets</h1>
      <p className="text-slate-400 text-sm mb-6">
        Key Vault secret health — {expiredCount > 0 && <span className="text-red-400">{expiredCount} expired</span>}
        {expiredCount > 0 && expiringSoonCount > 0 && ', '}
        {expiringSoonCount > 0 && <span className="text-yellow-400">{expiringSoonCount} expiring soon</span>}
        {expiredCount === 0 && expiringSoonCount === 0 && 'all healthy'}
      </p>

      {error && (
        <div className="mb-5 text-sm bg-yellow-900/40 border border-yellow-700 text-yellow-300 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-slate-500 text-sm py-12 text-center">Loading secrets…</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-900/50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Secret Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Rotated</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Days Until Expiry</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              </tr>
            </thead>
            <tbody>
              {secrets.map((s) => (
                <tr key={s.name} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-sm text-slate-200">{s.name}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{s.lastRotated}</td>
                  <td className="px-4 py-3 text-right">
                    {s.daysUntilExpiry !== null ? (
                      <span className={`text-sm font-semibold ${s.daysUntilExpiry <= 14 ? 'text-red-400' : s.daysUntilExpiry <= 30 ? 'text-yellow-400' : 'text-slate-300'}`}>
                        {s.daysUntilExpiry}d
                      </span>
                    ) : (
                      <span className="text-red-500 text-sm font-semibold">expired</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill status={s.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-slate-600 mt-4">Read-only view. Rotate secrets via Azure Key Vault or your secrets management CLI.</p>
    </div>
  );
}
