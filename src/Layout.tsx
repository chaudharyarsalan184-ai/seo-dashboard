import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from './lib/auth';

export default function Layout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-500 bg-clip-text text-transparent">
            Travel SEO
          </h1>
          <p className="text-xs text-slate-500 mt-1">Dashboard</p>
        </div>
        <nav className="space-y-1 px-3">
          <NavLink
            to="/"
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
            className={({ isActive }) =>
              `block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            All Blogs
          </NavLink>
        </nav>
        <div className="mt-auto p-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="ml-64 min-h-screen p-8">
        <Outlet />
      </main>
    </div>
  );
}
