import { useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function getJwtRole(): string | null {
  try {
    const token = localStorage.getItem('jwt');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

interface NavItem {
  id: string;
  path: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    id: 'journal',
    path: '/dashboard',
    label: 'Trades',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        <path d="M8 7h6" /><path d="M8 11h8" />
      </svg>
    ),
  },
  {
    id: 'chart',
    path: '/chart',
    label: 'Chart',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 16l4-8 4 4 4-6" /><rect x="2" y="2" width="20" height="20" rx="2" />
      </svg>
    ),
  },
  {
    id: 'analytics',
    path: '/analytics',
    label: 'Analytics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
      </svg>
    ),
  },
  {
    id: 'calendar',
    path: '/calendar',
    label: 'Calendar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
        <line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" />
        <line x1="3" x2="21" y1="10" y2="10" />
      </svg>
    ),
  },
  {
    id: 'psych-journal',
    path: '/journal',
    label: 'Journal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" />
      </svg>
    ),
  },
  {
    id: 'playbook',
    path: '/playbook',
    label: 'Playbook',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
];

const adminItem: NavItem = {
  id: 'admin',
  path: '/admin',
  label: 'Admin',
  icon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = useMemo(() => getJwtRole() === 'ADMIN', []);

  const items = useMemo(
    () => (isAdmin ? [...navItems, adminItem] : navItems),
    [isAdmin],
  );

  const activeId =
    items.find((item) => location.pathname === item.path)?.id ?? 'journal';

  const logout = () => {
    localStorage.removeItem('jwt');
    navigate('/');
  };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-[99] transition-opacity duration-200
          md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={`w-60 h-screen bg-panel border-r border-border-primary flex flex-col
          fixed left-0 top-0 z-[100] transition-transform duration-250 ease-out
          md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Logo */}
        <div className="px-5 py-6 border-b border-border-primary flex items-center gap-2.5">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6 text-brand"
          >
            <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
          </svg>
          <span className="text-lg font-extrabold text-brand">TradingJournal</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 flex flex-col gap-0.5">
          {items.map((item) => (
            <button
              key={item.id}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg w-full text-left
                text-sm font-medium transition-all duration-150
                ${
                  activeId === item.id
                    ? 'bg-brand-muted text-brand font-semibold'
                    : 'text-slate-400 hover:bg-surface-secondary hover:text-slate-100'
                }`}
              onClick={() => { navigate(item.path); onClose(); }}
            >
              <span className="w-5 h-5 shrink-0">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border-primary">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg
              text-sm font-medium text-slate-400 hover:bg-surface-secondary hover:text-slate-100
              border border-border-primary transition-all"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
