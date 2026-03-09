const API_BASE = import.meta.env.DEV ? 'http://localhost:3001/api' : '/api';

export async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const path = url.startsWith('/') ? url : `/${url}`;
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...options?.headers } });
  const text = await res.text();
  if (!res.ok) {
    try {
      const json = JSON.parse(text);
      throw new Error((json as { error?: string }).error || res.statusText);
    } catch (e) {
      if (text.startsWith('<')) throw new Error('API server not responding. Start it with: npm run server');
      throw new Error(text || res.statusText);
    }
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(text.startsWith('<') ? 'API server returned HTML. Is the backend running on port 3001? Run: npm run server' : 'Invalid JSON response');
  }
}

export const api = {
  websites: {
    list: () => fetchJSON<any[]>('/websites'),
    create: (data: { name: string; url: string; siteId?: string }) => fetchJSON<any>('/websites', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJSON('/websites/' + id, { method: 'DELETE' }),
  },
  categories: {
    list: () => fetchJSON<any[]>('/categories'),
    create: (data: { name: string }) => fetchJSON<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  },
  generateKeywords: (topic: string, category: string) =>
    fetchJSON<{ keywords: string[] }>('/generate-keywords', { method: 'POST', body: JSON.stringify({ topic, category }) }),
  generateContent: (topic: string, category: string, keywords: string[], angleIndex?: number) =>
    fetchJSON<{ content: string; metaTitle: string; metaDescription: string }>('/generate-content', {
      method: 'POST',
      body: JSON.stringify({ topic, category, keywords, angleIndex }),
    }),
  generateImage: (topic: string) =>
    fetchJSON<{ imageUrl?: string; imageData: string }>('/generate-image', { method: 'POST', body: JSON.stringify({ topic }) }),
  plagiarismCheck: (content: string) =>
    fetchJSON<{ uniqueness: number; similarity: number }>('/plagiarism-check', { method: 'POST', body: JSON.stringify({ content }) }),
  blogs: {
    list: () => fetchJSON<any[]>('/blogs'),
    create: (data: any) => fetchJSON<any>('/blogs', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { imageUrl?: string }) =>
      fetchJSON<any>('/blogs/' + id, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchJSON<{ success: boolean }>('/blogs/' + id, { method: 'DELETE' }),
    backfillImages: () =>
      fetchJSON<{ updated: number; total: number }>('/backfill-images', { method: 'POST' }),
  },
  syncAllBlogs: (websiteIds: string[]) =>
    fetchJSON<{ results: { id: string; name: string; success: number; failed: number; total: number }[] }>('/sync-all-blogs', {
      method: 'POST',
      body: JSON.stringify({ websiteIds }),
    }),
  clearSiteBlogs: (websiteIds: string[]) =>
    fetchJSON<{ results: { id: string; name: string; success: boolean }[] }>('/clear-site-blogs', {
      method: 'POST',
      body: JSON.stringify({ websiteIds }),
    }),
  uploadToWebsites: (blog: any, websiteIds: string[]) =>
    fetchJSON<{ results: { id: string; name: string; success: boolean; error?: string }[] }>('/upload-to-websites', {
      method: 'POST',
      body: JSON.stringify({ blog, websiteIds }),
    }),
};
