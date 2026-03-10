import { useEffect, useState } from 'react';
import { api } from '../api/client';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export default function CreateBlog() {
  const [step, setStep] = useState<Step>(1);
  const [websites, setWebsites] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [imageData, setImageData] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uniqueness, setUniqueness] = useState<number | null>(null);
  const [plagiarismNote, setPlagiarismNote] = useState<string | null>(null);
  const [wordLimit, setWordLimit] = useState(1000);
  const [numH2, setNumH2] = useState(5);
  const [numH3, setNumH3] = useState(2);
  const [numFaqs, setNumFaqs] = useState(4);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);

  useEffect(() => {
    api.websites.list().then(setWebsites);
    api.categories.list().then(setCategories);
  }, []);

  const toggleSite = (id: string) => {
    setSelectedSiteIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords((prev) =>
      prev.includes(kw) ? prev.filter((x) => x !== kw) : [...prev, kw]
    );
  };

  const fetchKeywords = async () => {
    if (!topic.trim() || !category) return;
    setLoading(true);
    try {
      const { keywords: kw } = await api.generateKeywords(topic, category);
      setKeywords(kw || []);
      setSelectedKeywords(kw || []);
      setStep(4);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const generateContent = async () => {
    setLoading(true);
    try {
      const [contentRes, imageRes] = await Promise.all([
        api.generateContent(topic, category, selectedKeywords.length ? selectedKeywords : keywords, undefined, {
          wordLimit,
          numH2,
          numH3,
          numFaqs,
        }),
        api.generateImage(topic),
      ]);
      setContent(contentRes.content);
      setMetaTitle(contentRes.metaTitle);
      setMetaDescription(contentRes.metaDescription);
      setImageData(imageRes.imageData);
      setImageUrl(imageRes.imageUrl || null);
      setStep(5);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const checkPlagiarism = async () => {
    setLoading(true);
    setPlagiarismNote(null);
    try {
      const res = await api.plagiarismCheck(content);
      setUniqueness(res.uniqueness);
      setPlagiarismNote(res.note || null);
      setStep(6);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const regenerateForUniqueness = async () => {
    setLoading(true);
    try {
      const angleIndex = Math.floor(Math.random() * 12);
      const [contentRes, imageRes] = await Promise.all([
        api.generateContent(topic, category, selectedKeywords.length ? selectedKeywords : keywords, angleIndex, {
          wordLimit,
          numH2,
          numH3,
          numFaqs,
        }),
        api.generateImage(topic),
      ]);
      setContent(contentRes.content);
      setMetaTitle(contentRes.metaTitle);
      setMetaDescription(contentRes.metaDescription);
      setImageData(imageRes.imageData);
      setImageUrl(imageRes.imageUrl || null);
      const { uniqueness: u } = await api.plagiarismCheck(contentRes.content);
      setUniqueness(u);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const saveAndUpload = async () => {
    setLoading(true);
    try {
      const blog = {
        topic,
        category,
        content,
        metaTitle,
        metaDescription,
        slug: slug.trim() || undefined,
        imageData,
        imageUrl,
        keywords: selectedKeywords,
        websiteIds: selectedSiteIds,
      };
      const created = await api.blogs.create(blog);
      const { results } = await api.uploadToWebsites(created, selectedSiteIds);
      setUploadResults(results);
      setStep(7);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6">Create Blog</h1>

      <div className="mb-6 md:mb-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 shrink-0">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s as Step)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                step >= s ? 'bg-cyan-500/30 text-cyan-400' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="text-slate-500 text-xs sm:text-sm shrink-0">Website → Category → Topic → Keywords → Content → Plagiarism → Publish</span>
      </div>

      {/* Step 1: Select websites */}
      {step === 1 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Select websites</h2>
          {websites.length === 0 ? (
            <p className="text-slate-500">Add websites in the Websites section first.</p>
          ) : (
            <div className="space-y-3">
              {websites.map((w) => (
                <label key={w.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSiteIds.includes(w.id)}
                    onChange={() => toggleSite(w.id)}
                    className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
                  />
                  <span className="text-white">{w.name}</span>
                  <span className="text-slate-500 text-sm">{w.url}</span>
                </label>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => setStep(2)}
            disabled={selectedSiteIds.length === 0}
            className="mt-6 rounded-lg bg-cyan-500 px-6 py-2 font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Step 2: Category */}
      {step === 2 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Select category</h2>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full max-w-md rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white focus:border-cyan-500 focus:outline-none"
          >
            <option value="">Choose...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-700">
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              disabled={!category}
              className="rounded-lg bg-cyan-500 px-6 py-2 font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Topic */}
      {step === 3 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Enter blog topic</h2>
          <input
            type="text"
            placeholder="e.g. Best beaches in Goa for families"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => setStep(2)} className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-700">
              Back
            </button>
            <button
              type="button"
              onClick={fetchKeywords}
              disabled={!topic.trim() || loading}
              className="rounded-lg bg-cyan-500 px-6 py-2 font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Get Keywords'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Keywords */}
      {step === 4 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Keywords (select to use)</h2>
          <div className="flex flex-wrap gap-2">
            {keywords.map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => toggleKeyword(kw)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                  selectedKeywords.includes(kw) ? 'bg-cyan-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {kw}
              </button>
            ))}
          </div>

          <div className="rounded-lg border border-slate-600 bg-slate-900/50 p-4 mb-6 mt-6 space-y-4">
            <h3 className="text-sm font-medium text-slate-300">Content options</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Word limit</label>
                <select
                  value={wordLimit}
                  onChange={(e) => setWordLimit(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
                >
                  {[500, 750, 1000, 1200, 1500, 2000].map((n) => (
                    <option key={n} value={n}>{n} words</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">H2 sections</label>
                <select
                  value={numH2}
                  onChange={(e) => setNumH2(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
                >
                  {[2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>{n} H2 sections</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">H3 per section</label>
                <select
                  value={numH3}
                  onChange={(e) => setNumH3(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
                >
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} H3 subsections</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">FAQs</label>
                <select
                  value={numFaqs}
                  onChange={(e) => setNumFaqs(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-white text-sm"
                >
                  {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <option key={n} value={n}>{n} FAQs</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={() => setStep(3)} className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-700">
              Back
            </button>
            <button
              type="button"
              onClick={generateContent}
              disabled={loading}
              className="rounded-lg bg-cyan-500 px-6 py-2 font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate Content with AI'}
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Content preview */}
      {step === 5 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Generated content</h2>
          <div className="mb-4 space-y-2">
            {(imageUrl || imageData) && (
              <img src={imageUrl || imageData!} alt="" className="rounded-lg w-full max-h-64 object-cover" />
            )}
            <div className="flex items-center gap-2">
              <label className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 cursor-pointer inline-block">
                Upload your own image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => {
                      const data = reader.result as string;
                      setImageData(data);
                      setImageUrl(data);
                    };
                    reader.readAsDataURL(file);
                    e.target.value = '';
                  }}
                />
              </label>
              {(imageUrl || imageData) && (
                <button
                  type="button"
                  onClick={() => { setImageData(null); setImageUrl(null); }}
                  className="text-xs text-slate-500 hover:text-red-400"
                >
                  Remove image
                </button>
              )}
            </div>
          </div>
          <div className="space-y-2 mb-4">
            <label className="block text-sm text-slate-400">Meta Title</label>
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white"
            />
            <label className="block text-sm text-slate-400">Meta Description</label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white"
            />
          </div>
          <div className="max-h-96 overflow-y-auto rounded-lg border border-slate-600 bg-slate-900 p-6 text-slate-300 prose prose-invert max-w-none">
            <article dangerouslySetInnerHTML={{ __html: content }} />
          </div>
          <div className="mt-4 flex gap-3">
            <button type="button" onClick={() => setStep(4)} className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-700">
              Back
            </button>
            <button
              type="button"
              onClick={checkPlagiarism}
              disabled={loading}
              className="rounded-lg bg-cyan-500 px-6 py-2 font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check Uniqueness'}
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Plagiarism */}
      {step === 6 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Uniqueness check</h2>
          <div className="mb-4">
            <label className="block text-sm text-slate-400 mb-1">URL slug (optional)</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="Leave empty to auto-generate from title"
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-white text-sm placeholder-slate-500"
            />
            <p className="text-xs text-slate-500 mt-1">e.g. my-custom-blog-url — used in /blog/your-slug</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
            <div className={`rounded-full p-4 shrink-0 ${uniqueness !== null && uniqueness >= 90 ? 'bg-emerald-500/20' : uniqueness !== null && uniqueness >= 70 ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
              <span className={`text-2xl font-bold ${uniqueness !== null && uniqueness >= 90 ? 'text-emerald-400' : uniqueness !== null && uniqueness >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
                {uniqueness !== null ? `${uniqueness}%` : '...'}
              </span>
            </div>
            <div>
              <p className="text-slate-400">
                {uniqueness !== null && uniqueness >= 90 && 'Great! Content is highly unique.'}
                {uniqueness !== null && uniqueness >= 70 && uniqueness < 90 && 'Acceptable. Consider editing for more uniqueness.'}
                {uniqueness !== null && uniqueness < 70 && 'Low uniqueness. Regenerate or edit content.'}
              </p>
              {plagiarismNote && <p className="text-amber-400 text-sm mt-1">{plagiarismNote}</p>}
              <p className="text-slate-500 text-xs mt-1">Our check compares against your saved blogs. Use external tools (e.g. Copyscape) for web-wide verification.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setStep(5)} className="rounded-lg border border-slate-600 px-4 py-2 text-slate-300 hover:bg-slate-700">
              Back to edit
            </button>
            <button
              type="button"
              onClick={regenerateForUniqueness}
              disabled={loading}
              className="rounded-lg bg-cyan-500 px-6 py-2 font-medium text-white hover:bg-cyan-600 disabled:opacity-50"
            >
              {loading ? 'Regenerating...' : 'Regenerate (try different angle)'}
            </button>
            <button
              type="button"
              onClick={saveAndUpload}
              disabled={loading}
              className="rounded-lg bg-emerald-500 px-6 py-2 font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Save & Upload to Websites'}
            </button>
          </div>
        </div>
      )}

      {/* Step 7: Done */}
      {step === 7 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 md:p-6">
          <h2 className="text-lg font-semibold text-emerald-400 mb-4">Blog saved & upload initiated</h2>
          <div className="space-y-2 mb-4">
            {uploadResults.map((r) => (
              <div key={r.id} className="flex items-center gap-2">
                {r.success ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-red-400">✗</span>
                )}
                <span className="text-white">{r.name}</span>
                {r.success ? (
                  <span className="text-slate-500 text-sm">Uploaded</span>
                ) : (
                  <span className="text-red-400 text-sm">{r.error}</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-slate-400 text-sm mb-4">
            If upload failed, ensure your website has an endpoint: POST /api/receive-blog?siteId=YOUR_ID
          </p>
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setTopic('');
              setContent('');
              setKeywords([]);
              setSelectedKeywords([]);
              setMetaTitle('');
              setMetaDescription('');
              setSlug('');
              setImageData(null);
              setImageUrl(null);
              setUniqueness(null);
              setPlagiarismNote(null);
              setUploadResults([]);
            }}
            className="rounded-lg bg-cyan-500 px-6 py-2 font-medium text-white hover:bg-cyan-600"
          >
            Create another blog
          </button>
        </div>
      )}
    </div>
  );
}
