import { useEffect, useState } from 'react';
import { api } from '../api/client';

export default function Blogs() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchedImageUrl, setFetchedImageUrl] = useState<string | null>(null);

  const load = () => api.blogs.list().then(setBlogs).catch(() => setBlogs([]));

  useEffect(() => {
    load();
  }, []);

  const hasTopicImage = (url: string | null | undefined) =>
    url && typeof url === 'string' && url.includes('images.unsplash.com');

  // Fetch topic-related image when modal opens with a blog that has no real imageUrl (or has Picsum/random)
  useEffect(() => {
    if (!selected?.topic) {
      setFetchedImageUrl(null);
      return;
    }
    if (hasTopicImage(selected.imageUrl)) {
      setFetchedImageUrl(null);
      return;
    }
    setFetchedImageUrl(null);
    api.generateImage(selected.topic)
      .then(async (res) => {
        const url = res.imageUrl || null;
        setFetchedImageUrl(url);
        if (url && selected?.id) {
          await api.blogs.update(selected.id, { imageUrl: url });
          setBlogs((prev) => prev.map((b) => (b.id === selected.id ? { ...b, imageUrl: url } : b)));
        }
      })
      .catch(() => setFetchedImageUrl(null));
  }, [selected?.id, selected?.topic, selected?.imageUrl]);

  const backfillImages = async () => {
    setLoading(true);
    try {
      const { updated } = await api.blogs.backfillImages();
      load();
      alert(updated ? `Updated ${updated} blog(s) with topic-related images.` : 'All blogs already have topic images.');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Permanently delete this blog? This cannot be undone.')) return;
    setLoading(true);
    try {
      await api.blogs.delete(id);
      setSelected(null);
      load();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const imgSrc = (b: any) => b.imageUrl || b.imageData;
  const modalImgSrc = selected ? (selected.imageUrl || fetchedImageUrl || selected.imageData) : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold text-white">All Blogs</h1>
        <button
          type="button"
          onClick={backfillImages}
          disabled={loading || blogs.length === 0}
          className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Refresh topic images'}
        </button>
      </div>
      <div className="space-y-4">
        {blogs.map((b) => (
          <div
            key={b.id}
            onClick={() => setSelected(b)}
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 cursor-pointer hover:border-cyan-500/50 transition-colors"
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white">{b.topic}</h3>
                <p className="text-slate-500 text-sm">{b.category}</p>
                <p className="text-slate-400 text-sm mt-2 line-clamp-2">{b.metaDescription}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {(b.keywords || []).slice(0, 5).map((kw: string) => (
                    <span key={kw} className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <p className="text-slate-500 text-xs">{new Date(b.createdAt).toLocaleDateString()}</p>
                <button
                  type="button"
                  onClick={(e) => handleDelete(b.id, e)}
                  disabled={loading}
                  className="rounded-lg border border-red-500/50 px-3 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
            {imgSrc(b) && (
              <img src={imgSrc(b)} alt="" className="mt-4 rounded-lg w-48 h-24 object-cover" />
            )}
          </div>
        ))}
      </div>
      {blogs.length === 0 && (
        <p className="text-slate-500 text-center py-12">No blogs yet. Create one from Create Blog.</p>
      )}

      {/* View modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="rounded-xl border border-slate-700 bg-slate-900 max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-700 flex justify-between items-start">
              <h2 className="text-xl font-semibold text-white">{selected.topic}</h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto p-6 space-y-4">
              {modalImgSrc && (
                <img src={modalImgSrc} alt="" className="w-full max-h-64 object-cover rounded-lg" />
              )}
              <p className="text-slate-500 text-sm">{selected.category}</p>
              <p className="text-slate-400 text-sm">{selected.metaDescription}</p>
              <p className="text-slate-500 text-xs">Meta: {selected.metaTitle}</p>
              <div className="prose prose-invert prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: selected.content || '' }} />
              </div>
              <div className="flex flex-wrap gap-1 pt-2">
                {(selected.keywords || []).map((kw: string) => (
                  <span key={kw} className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
            <div className="p-4 border-t border-slate-700 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { handleDelete(selected.id, { stopPropagation: () => {} } as React.MouseEvent); }}
                disabled={loading}
                className="rounded-lg border border-red-500/50 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
              >
                Delete permanently
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg bg-slate-600 px-4 py-2 text-sm text-white hover:bg-slate-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
