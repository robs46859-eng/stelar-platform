import { NavLink } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/properties', label: 'Properties' },
  { to: '/screening', label: 'Screening' },
  { to: '/tenants', label: 'Tenants' },
];

export default function NavBar() {
  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-0 flex items-center gap-1 h-14">
      <span className="font-semibold text-slate-800 text-base mr-6">StelarPeople</span>
      {links.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.to === '/'}
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  );
}
