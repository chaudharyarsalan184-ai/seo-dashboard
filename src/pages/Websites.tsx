import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Websites() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const load = () => api.websites.list().then(setWebsites);

  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    setLoading(true);
    try {
      await api.websites.create({ name: name.trim(), url: url.trim() });
      setName('');
      setUrl('');
      load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this website?')) return;
    try {
      await api.websites.delete(id);
      load();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    alert('Website ID copied! Use this to connect your website to the dashboard.');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Websites</h1>
      <p className="text-slate-400 mb-6">Add your travel websites. Each gets a unique ID to connect for auto blog uploads.</p>

      <form onSubmit={add} className="mb-10 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Website name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <input
          type="url"
          placeholder="https://yoursite.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-cyan-500 px-6 py-2 font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add Website'}
        </button>
      </form>

      <div className="space-y-4">
        {websites.map((w) => (
          <div
            key={w.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4"
          >
            <div>
              <p className="font-medium text-white">{w.name}</p>
              <a href={w.url} target="_blank" rel="noreferrer" className="text-sm text-cyan-400 hover:underline">
                {w.url}
              </a>
              <div className="mt-2 flex items-center gap-2">
                <code className="rounded bg-slate-900 px-2 py-0.5 text-xs text-slate-300">{w.id}</code>
                <button
                  type="button"
                  onClick={() => copyId(w.id)}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Copy ID
                </button>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  setSyncingId(w.id);
                  try {
                    const { results } = await api.syncAllBlogs([w.id]);
                    const r = results[0];
                    alert(r ? `${r.success}/${r.total} blogs synced to ${w.name}${r.total === 0 ? ' (site cleared)' : ''}` : 'Done');
                  } catch (e) {
                    alert((e as Error).message);
                  } finally {
                    setSyncingId(null);
                  }
                }}
                disabled={!!syncingId}
                className="rounded-lg border border-cyan-500/50 px-3 py-1 text-sm text-cyan-400 hover:bg-cyan-500/10 disabled:opacity-50"
              >
                Sync all blogs
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!confirm(`Clear all SEO blogs on ${w.name}?`)) return;
                  setSyncingId(w.id);
                  try {
                    const { results } = await api.clearSiteBlogs([w.id]);
                    const r = results[0];
                    alert(r?.success ? `Site cleared` : (r ? 'Clear failed' : 'Error'));
                  } catch (e) {
                    alert((e as Error).message);
                  } finally {
                    setSyncingId(null);
                  }
                }}
                disabled={!!syncingId}
                className="rounded-lg border border-amber-500/50 px-3 py-1 text-sm text-amber-400 hover:bg-amber-500/10 disabled:opacity-50"
              >
                Clear site
              </button>
              <button
                type="button"
                onClick={() => remove(w.id)}
                className="rounded-lg border border-red-500/50 px-4 py-1 text-sm text-red-400 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {websites.length === 0 && (
        <p className="text-slate-500 text-center py-12">No websites yet. Add one above.</p>
      )}

      <div className="mt-10 rounded-xl border border-slate-700 bg-slate-800/30 p-6 space-y-4">
        <h3 className="font-semibold text-white mb-2">How to connect your travel websites</h3>
        <ol className="text-slate-400 text-sm space-y-2 list-decimal list-inside">
          <li>Add your site above (name + URL like <code className="bg-slate-900 px-1 rounded">https://yoursite.com</code>)</li>
          <li>Copy the <strong className="text-slate-300">Unique ID</strong> for that website</li>
          <li>On your travel site, create an API endpoint: <code className="bg-slate-900 px-1 rounded">POST /api/receive-blog?siteId=YOUR_ID</code></li>
          <li>Verify <code className="bg-slate-900 px-1 rounded">siteId</code> matches your ID, then save the blog (DB, JSON, WordPress post, etc.)</li>
        </ol>
        <p className="text-slate-500 text-sm">
          The dashboard sends: <code className="bg-slate-900 px-1 rounded">topic</code>, <code className="bg-slate-900 px-1 rounded">category</code>, <code className="bg-slate-900 px-1 rounded">content</code> (HTML), <code className="bg-slate-900 px-1 rounded">metaTitle</code>, <code className="bg-slate-900 px-1 rounded">metaDescription</code>, <code className="bg-slate-900 px-1 rounded">imageData</code>, <code className="bg-slate-900 px-1 rounded">keywords</code>
        </p>
        <p className="text-slate-500 text-sm">
          See <code className="bg-slate-900 px-1 rounded">CONNECT-WEBSITES.md</code> in the project folder for Node.js, PHP, and WordPress code examples.
        </p>
      </div>
    </div>
  );
}
