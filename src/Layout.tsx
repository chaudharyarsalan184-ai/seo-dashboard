import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from './lib/auth';

const NavContent = ({ onNavigate, onLogout }: { onNavigate?: () => void; onLogout: () => void }) => (
  <>
    <div className="p-4 md:p-6">
      <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-500 bg-clip-text text-transparent">
        Travel SEO
      </h1>
      <p className="text-xs text-slate-500 mt-1">Dashboard</p>
    </div>
    <nav className="space-y-1 px-3 flex-1">
      <NavLink
        to="/"
        onClick={onNavigate}
        className={({ isActive }) =>
          `block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            isActive ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`
        }
      >
        Overview
      </NavLink>
      <NavLink
        to="/websites"
        onClick={onNavigate}
        className={({ isActive }) =>
          `block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            isActive ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`
        }
      >
        Websites
      </NavLink>
      <NavLink
        to="/create-blog"
        onClick={onNavigate}
        className={({ isActive }) =>
          `block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            isActive ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`
        }
      >
        Create Blog
      </NavLink>
      <NavLink
        to="/blogs"
        onClick={onNavigate}
        className={({ isActive }) =>
          `block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
            isActive ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
          }`
        }
      >
        All Blogs
      </NavLink>
    </nav>
    <div className="p-4 border-t border-slate-800">
      <button
        type="button"
        onClick={onLogout}
        className="w-full rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
      >
        Logout
      </button>
    </div>
  </>
);

export default function Layout() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-x-hidden">
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-14 px-4 border-b border-slate-800 bg-slate-950/95 backdrop-blur">
        <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-emerald-500 bg-clip-text text-transparent">
          Travel SEO
        </h1>
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - drawer on mobile (below header), fixed on desktop */}
      <aside
        className={`fixed left-0 top-14 md:top-0 h-[calc(100vh-3.5rem)] md:h-full w-64 max-w-[85vw] border-r border-slate-800 bg-slate-900/95 backdrop-blur flex flex-col z-40 transition-transform duration-200 ease-out md:translate-x-0 md:max-w-none ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <NavContent onNavigate={() => setMobileOpen(false)} onLogout={handleLogout} />
      </aside>

      {/* Main content */}
      <main className="min-h-screen pt-14 md:pt-0 md:ml-64 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
