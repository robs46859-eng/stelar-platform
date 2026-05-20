import type { PropertyStatus, ScreeningStatus } from '../types.ts';

type Status = PropertyStatus | ScreeningStatus;

const colorMap: Record<Status, string> = {
  occupied: 'bg-green-100 text-green-800',
  vacant: 'bg-yellow-100 text-yellow-800',
  maintenance: 'bg-orange-100 text-orange-800',
  listed: 'bg-blue-100 text-blue-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  denied: 'bg-red-100 text-red-800',
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorMap[status]}`}
    >
      {status}
    </span>
  );
}
