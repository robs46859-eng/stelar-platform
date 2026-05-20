type PillStatus = 'healthy' | 'degraded' | 'down' | 'online' | 'offline' | 'active' | 'idle' | 'error' | 'stopped' | 'ok' | 'expiring-soon' | 'expired' | 'pending' | 'approved' | 'rejected' | 'low' | 'medium' | 'high' | 'critical';

const colorMap: Record<PillStatus, string> = {
  healthy: 'bg-green-900 text-green-300 border-green-700',
  online: 'bg-green-900 text-green-300 border-green-700',
  active: 'bg-green-900 text-green-300 border-green-700',
  ok: 'bg-green-900 text-green-300 border-green-700',
  approved: 'bg-green-900 text-green-300 border-green-700',
  degraded: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  idle: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  'expiring-soon': 'bg-yellow-900 text-yellow-300 border-yellow-700',
  pending: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  medium: 'bg-yellow-900 text-yellow-300 border-yellow-700',
  low: 'bg-blue-900 text-blue-300 border-blue-700',
  down: 'bg-red-900 text-red-300 border-red-700',
  offline: 'bg-red-900 text-red-300 border-red-700',
  error: 'bg-red-900 text-red-300 border-red-700',
  stopped: 'bg-slate-700 text-slate-300 border-slate-600',
  expired: 'bg-red-900 text-red-300 border-red-700',
  rejected: 'bg-red-900 text-red-300 border-red-700',
  high: 'bg-orange-900 text-orange-300 border-orange-700',
  critical: 'bg-red-900 text-red-300 border-red-700',
};

export default function StatusPill({ status }: { status: PillStatus }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${colorMap[status]}`}>
      {status}
    </span>
  );
}
