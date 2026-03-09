import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Dashboard() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([api.websites.list(), api.blogs.list()]).then(([w, b]) => {
      setWebsites(w);
      setBlogs(b);
    }).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-6 md:mb-8">SEO Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <p className="text-slate-400 text-sm">Websites</p>
          <p className="text-3xl font-bold text-cyan-400 mt-1">{websites.length}</p>
          <Link to="/websites" className="text-cyan-400 text-sm mt-2 inline-block hover:underline">
            Manage →
          </Link>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <p className="text-slate-400 text-sm">Total Blogs</p>
          <p className="text-3xl font-bold text-emerald-400 mt-1">{blogs.length}</p>
          <Link to="/blogs" className="text-emerald-400 text-sm mt-2 inline-block hover:underline">
            View all →
          </Link>
        </div>
        <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
          <p className="text-slate-400 text-sm">Quick Action</p>
          <Link
            to="/create-blog"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600"
          >
            Create New Blog
          </Link>
        </div>
      </div>
      <div className="mt-10 rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Setup</h2>
        <p className="text-slate-400 text-sm mb-4">
          Add your Groq API key (free) for AI content generation. Get it from{' '}
          <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
            console.groq.com
          </a>
        </p>
        <p className="text-slate-500 text-xs">
          Add to <code className="bg-slate-900 px-2 py-0.5 rounded">.env</code>: <code className="bg-slate-900 px-2 py-0.5 rounded">GROQ_API_KEY=...</code>, <code className="bg-slate-900 px-2 py-0.5 rounded">UNSPLASH_ACCESS_KEY=...</code> (optional, for topic-relevant images)
        </p>
      </div>
    </div>
  );
}
