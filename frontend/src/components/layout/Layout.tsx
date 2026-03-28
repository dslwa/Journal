import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';

export default function Layout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-[101] md:hidden bg-panel border border-border-primary
          rounded-lg p-2 text-slate-100"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open menu"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-6 h-6"
        >
          <line x1="4" x2="20" y1="12" y2="12" />
          <line x1="4" x2="20" y1="6" y2="6" />
          <line x1="4" x2="20" y1="18" y2="18" />
        </svg>
      </button>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 md:ml-60 p-6 md:p-8 lg:p-10 pt-16 md:pt-8 min-w-0">
        {children}
      </main>
    </div>
  );
}
