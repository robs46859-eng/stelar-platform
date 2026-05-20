import type { ReactNode } from 'react';

export default function DarkCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
