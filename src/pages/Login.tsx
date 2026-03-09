import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login, isAuthenticated } from '../lib/auth';

export default function Login() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated()) navigate(from, { replace: true });
  }, [navigate, from]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    if (login(id, password)) {
      navigate(from, { replace: true });
    } else {
      setError('Invalid ID or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-8 shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-emerald-500 bg-clip-text text-transparent">
              Travel SEO
            </h1>
            <p className="text-slate-500 text-sm mt-1">Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-slate-400 mb-2">
                ID
              </label>
              <input
                id="id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="Enter your ID"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-400 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-3 font-medium text-white hover:from-cyan-600 hover:to-emerald-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 transition-all"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
