import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Overview' },
  { to: '/gateway', label: 'Gateway' },
  { to: '/governance', label: 'Governance' },
  { to: '/agents', label: 'Agents' },
  { to: '/secrets', label: 'Secrets' },
];

export default function NavBar() {
  return (
    <nav className="bg-slate-900 border-b border-slate-700 px-6 py-0 flex items-center gap-1 h-14">
      <span className="font-semibold text-slate-100 text-base mr-6">FullStack Dashboard</span>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === '/'}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
