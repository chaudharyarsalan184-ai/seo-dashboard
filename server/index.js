import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import Groq from 'groq-sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load .env from multiple locations
[path.join(__dirname, '..', '.env'), path.join(__dirname, '..', '.env.local'), path.join(__dirname, '.env')].forEach((p) => {
  dotenv.config({ path: p });
});
// Fallback: read .env directly if env vars still not set
for (const [key, pattern] of [['GROQ_API_KEY', /GROQ_API_KEY\s*=\s*([^\s#]+)/], ['UNSPLASH_ACCESS_KEY', /UNSPLASH_ACCESS_KEY\s*=\s*([^\s#]+)/], ['GOOGLE_AI_API_KEY', /GOOGLE_AI_API_KEY\s*=\s*([^\s#]+)/]]) {
  if (!process.env[key]?.trim()) {
    try {
      const envPath = path.join(__dirname, '..', '.env');
      const envContent = await fs.readFile(envPath, 'utf-8');
      const match = envContent.match(pattern);
      if (match) process.env[key] = match[1].trim();
    } catch {}
  }
}
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Data storage
const DATA_DIR = path.join(__dirname, 'data');
const WEBSITES_FILE = path.join(DATA_DIR, 'websites.json');
const BLOGS_FILE = path.join(DATA_DIR, 'blogs.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

const defaultCategories = [
  'Travel Tips', 'Destination Guides', 'Adventure Travel', 'Budget Travel',
  'Luxury Travel', 'Family Travel', 'Solo Travel', 'Road Trips',
  'Beach Holidays', 'Cultural Experiences', 'Food & Dining', 'Travel Gear'
];

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function loadJSON(file, defaultValue = []) {
  try {
    const data = await fs.readFile(file, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

async function saveJSON(file, data) {
  await ensureDataDir();
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

// Groq client - use GROQ_API_KEY (get free key from console.groq.com)
function getGroq() {
  const apiKey = process.env.GROQ_API_KEY || '';
  if (!apiKey) throw new Error('GROQ_API_KEY not set. Get free key from console.groq.com');
  return new Groq({ apiKey });
}

async function groqChat(prompt) {
  const groq = getGroq();
  const resp = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
  });
  return resp.choices[0]?.message?.content || '';
}

async function groqChatWithSystem(systemPrompt, userPrompt) {
  const groq = getGroq();
  const resp = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.85,
    max_tokens: 4096,
  });
  return resp.choices[0]?.message?.content || '';
}

// ============ WEBSITES ============
app.get('/api/websites', async (req, res) => {
  try {
    const websites = await loadJSON(WEBSITES_FILE);
    res.json(websites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/websites', async (req, res) => {
  try {
    const { name, url, siteId } = req.body;
    const websites = await loadJSON(WEBSITES_FILE);
    const uniqueId = (siteId && String(siteId).trim()) || randomUUID().replace(/-/g, '').slice(0, 16);
    const website = { id: uniqueId, name, url, createdAt: new Date().toISOString() };
    websites.push(website);
    await saveJSON(WEBSITES_FILE, websites);
    res.json(website);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/websites/:id', async (req, res) => {
  try {
    let websites = await loadJSON(WEBSITES_FILE);
    websites = websites.filter(w => w.id !== req.params.id);
    await saveJSON(WEBSITES_FILE, websites);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ CATEGORIES ============
app.get('/api/categories', async (req, res) => {
  try {
    let categories = await loadJSON(CATEGORIES_FILE);
    if (categories.length === 0) {
      categories = defaultCategories.map((c, i) => ({ id: String(i), name: c }));
      await saveJSON(CATEGORIES_FILE, categories);
    }
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    const categories = await loadJSON(CATEGORIES_FILE);
    const id = String(categories.length + 1);
    categories.push({ id, name });
    await saveJSON(CATEGORIES_FILE, categories);
    res.json({ id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ KEYWORDS (AI) ============
app.post('/api/generate-keywords', async (req, res) => {
  try {
    const { topic, category } = req.body;
    const prompt = `You are an SEO expert for travel websites. For the blog topic "${topic}" in category "${category}", generate 10-15 relevant SEO keywords and phrases. Return ONLY a JSON array of strings, no other text. Example: ["keyword1","keyword2"]`;
    const text = await groqChat(prompt);
    let keywords = [];
    try {
      const parsed = JSON.parse(text.replace(/```json?\s*/g, '').replace(/```/g, '').trim());
      keywords = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      keywords = text.split(/[\n,]/).map(k => k.trim().replace(/["'\[\]]/g, '')).filter(Boolean).slice(0, 15);
    }
    res.json({ keywords });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unique angles to force varied, original content each time
const UNIQUE_ANGLES = [
  'focus on underrated spots most guides miss',
  'write from perspective of a local who returned after years away',
  'emphasize practical logistics and real costs',
  'include surprising cultural or historical context',
  'compare with a lesser-known alternative destination',
  'focus on seasonal or weather-specific advice',
  'address common myths and misconceptions',
  'include personal mishaps or lessons learned',
  'emphasize eco-friendly and sustainable options',
  'target a specific niche (solo travelers / families / photographers)',
  'incorporate local slang and authentic recommendations',
  'focus on food, markets, and street-level experiences',
];

const BANNED_PHRASES = `NEVER use these phrases (instant plagiarism): "hidden gem", "picture-perfect", "bucket list", "off the beaten path", "stunning views", "breathtaking", "must-visit", "paradise", "heaven on earth", "worth every penny", "dream destination", "unforgettable experience", "once in a lifetime", "best kept secret", "worth the trip", "don't miss", "highly recommend", "perfect for", "ideal destination". Create your OWN phrases every time.`;

// ============ BLOG CONTENT (AI) ============
app.post('/api/generate-content', async (req, res) => {
  try {
    const { topic, category, keywords, angleIndex, wordLimit, numH2, numH3, numFaqs } = req.body;
    const kwList = Array.isArray(keywords) ? keywords.join(', ') : keywords;
    const idx = typeof angleIndex === 'number' ? angleIndex % UNIQUE_ANGLES.length : Math.floor(Math.random() * UNIQUE_ANGLES.length);
    const angle = UNIQUE_ANGLES[idx];
    const words = Math.min(2000, Math.max(300, parseInt(wordLimit, 10) || 1000));
    const h2Count = Math.min(10, Math.max(2, parseInt(numH2, 10) || 5));
    const h3PerH2 = Math.min(6, Math.max(0, parseInt(numH3, 10) || 2));
    const faqCount = Math.min(10, Math.max(2, parseInt(numFaqs, 10) || 4));

    const h3Req = h3PerH2 > 0 ? `Each h2 MUST have exactly ${h3PerH2} <h3> subsections.` : 'Do not use h3 tags.';

    const contentPrompt = `You are an original travel writer. Your content must be 100% unique - ZERO plagiarism. Write ONLY in your own invented phrases. Never use common travel-writing formulas.

TOPIC: "${topic}" | CATEGORY: "${category}"
UNIQUE ANGLE (strictly follow): ${angle}

${BANNED_PHRASES}
- Invent every sentence from scratch. Use specific numbers, local names, real prices.
- Vary sentence length wildly (3 words to 30 words). No repetitive patterns.
- Include personal opinions or surprising takes that no standard guide would have.

SEO keywords to weave in naturally: ${kwList}

=== MANDATORY OUTPUT STRUCTURE ===
1. <h1>Unique title</h1>
2. <p>Opening (80-120 words)</p>
3. MAIN BODY: Exactly ${h2Count} <h2> sections. ${h3Req}

4. BULLET & NUMBERED LISTS (critical - include in multiple sections):
   - For each section that lists items, use: <p>Intro line (e.g. "Typical factors:" or "Key benefits:")</p><ul><li>Item one</li><li>Item two</li></ul>
   - Include at least 3-4 bullet list sections with intro lines. Example format:
     <h2>Eligibility Criteria</h2>
     <p>Typical eligibility factors:</p>
     <ul><li>Minimum age requirement (65+)</li><li>Valid ID</li></ul>
   - Include at least 1 numbered/steps section. Example:
     <h2>How to Book</h2>
     <ol><li>Search flights</li><li>Select fare</li><li>Enter details</li><li>Confirm</li></ol>
   - Include a "Tips" or "Benefits" section with <ul><li>bullet points</li></ul>

5. <h2>Frequently Asked Questions</h2> - Include exactly ${faqCount} FAQs about "${topic}". Format: <h3>Question?</h3><p>Answer.</p>
6. <p>Conclusion</p>

=== CRITICAL REQUIREMENTS ===
- WORD COUNT: Your response MUST be ${words} words minimum. Aim for ${words}-${words + 100}. Each h2 section ≈ ${Math.round(words / (h2Count + 2))} words.
- H2 TAGS: Exactly ${h2Count} <h2> in main body + 1 <h2>FAQ</h2>. Total: ${h2Count + 1} h2 tags.
- BULLET LISTS: At least 3-4 <ul><li> lists with intro lines like "Typical factors:" or "Key benefits:" before each list. Use <ol><li> for any "How to" steps.
- FAQ: Exactly ${faqCount} <h3>Question?</h3><p>Answer</p> pairs.
- OUTPUT: Raw HTML only. Start with <h1>. No markdown, no \`\`\`, no explanation.`;
    
    const metaPrompt = `Generate SEO meta for a travel blog: Topic "${topic}", Category "${category}". 
Return ONLY valid JSON: {"metaTitle":"...","metaDescription":"..."} 
metaTitle: 50-60 chars, include main keyword. metaDescription: 150-160 chars, compelling.`;
    
    const systemPrompt = `You are a travel blogger. RULES: 1) Follow word count EXACTLY - count your output. 2) Use EXACTLY the number of h2/h3 tags specified. 3) Write 100% in your own words - zero copied phrases. 4) Include bullet lists and FAQ. 5) Output only valid HTML, no markdown.`;

    const [contentText, metaText] = await Promise.all([
      groqChatWithSystem(systemPrompt, contentPrompt),
      groqChat(metaPrompt)
    ]);
    
    let metaTitle = topic;
    let metaDescription = `Discover ${topic} - travel guide and tips.`;
    try {
      const parsedMeta = metaText.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
      const meta = JSON.parse(parsedMeta);
      metaTitle = meta.metaTitle || meta.title || metaTitle;
      metaDescription = meta.metaDescription || meta.description || metaDescription;
    } catch {}
    
    const content = contentText.replace(/```html?\s*/g, '').replace(/```/g, '').trim();
    
    res.json({ content, metaTitle, metaDescription });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ IMAGE (Unsplash = topic-relevant, or Picsum fallback) ============
function slugifyForSeed(text) {
  return (text || 'travel').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'travel';
}

/** Returns topic-related image URL from Unsplash, or Picsum fallback. Used for sync/upload. */
async function fetchTopicImageUrl(topic) {
  const seed = slugifyForSeed(topic);
  const picsumFallback = `https://picsum.photos/seed/${seed}/800/400`;
  let imageUrl = picsumFallback;
  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (unsplashKey) {
    try {
      const query = encodeURIComponent(`${topic} travel destination`);
      const resp = await fetch(`https://api.unsplash.com/search/photos?query=${query}&client_id=${unsplashKey}&per_page=1&orientation=landscape`);
      const data = await resp.json();
      if (data?.results?.[0]?.urls?.regular) {
        imageUrl = data.results[0].urls.regular;
      }
    } catch {}
  }
  return imageUrl;
}

function hasTopicRelevantImage(url) {
  return url && typeof url === 'string' && url.includes('images.unsplash.com');
}

app.post('/api/generate-image', async (req, res) => {
  const topic = req.body?.topic || 'Travel';
  const imageUrl = await fetchTopicImageUrl(topic);
  const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#0ea5e9"/><stop offset="100%" style="stop-color:#8b5cf6"/></linearGradient></defs><rect fill="url(#g)" width="800" height="400"/><text x="400" y="200" text-anchor="middle" fill="white" font-size="28" font-family="sans-serif">${topic}</text></svg>`;
  res.json({ imageUrl, imageData: 'data:image/svg+xml;base64,' + Buffer.from(placeholderSvg).toString('base64') });
});

// ============ PLAGIARISM / UNIQUENESS CHECK ============
// Common travel phrases that often trigger plagiarism detectors
const COMMON_PHRASES = [
  'hidden gem', 'off the beaten path', 'bucket list', 'must-visit', 'worth the trip',
  'picture perfect', 'stunning views', 'breathtaking', 'paradise', 'heaven on earth',
  'once in a lifetime', 'travel experience', 'best time to visit', 'don\'t miss',
  'highly recommend', 'perfect destination', 'ideal for', 'rich in culture',
  'steeped in history', 'vibrant', 'charming', 'enchanting', 'magical', 'unforgettable',
  'dream destination', 'best kept secret', 'worth every penny', 'ideal destination'
];

function ngramSimilarity(text1, text2, n = 4) {
  const getNgrams = (t) => {
    const normalized = t.toLowerCase().replace(/\s+/g, ' ');
    const ngrams = new Set();
    for (let i = 0; i <= normalized.length - n; i++) {
      ngrams.add(normalized.substring(i, i + n));
    }
    return ngrams;
  };
  const ng1 = getNgrams(text1);
  const ng2 = getNgrams(text2);
  let matches = 0;
  for (const n of ng1) {
    if (ng2.has(n)) matches++;
  }
  return ng1.size > 0 ? (matches / ng1.size) * 100 : 0;
}

function commonPhrasePenalty(text) {
  const lower = text.toLowerCase();
  let count = 0;
  for (const phrase of COMMON_PHRASES) {
    if (lower.includes(phrase)) count += 3; // each match reduces uniqueness
  }
  return Math.min(30, count); // max 30% penalty
}

app.post('/api/plagiarism-check', async (req, res) => {
  try {
    const { content } = req.body;
    const blogs = await loadJSON(BLOGS_FILE);

    let maxSimilarity = 0;
    for (const blog of blogs) {
      const sim3 = ngramSimilarity(content, blog.content || '', 3);
      const sim4 = ngramSimilarity(content, blog.content || '', 4);
      const sim = Math.max(sim3, sim4);
      if (sim > maxSimilarity) maxSimilarity = sim;
    }

    const phrasePenalty = commonPhrasePenalty(content);
    const uniqueness = Math.max(0, Math.min(100, 100 - maxSimilarity - phrasePenalty));
    res.json({
      uniqueness: Math.round(uniqueness * 10) / 10,
      similarity: Math.round(maxSimilarity * 10) / 10,
      note: phrasePenalty > 0 ? 'Common phrases detected. Consider replacing for better uniqueness.' : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ SAVE BLOG & UPLOAD ============
app.post('/api/blogs', async (req, res) => {
  try {
    const blog = { id: randomUUID(), ...req.body, createdAt: new Date().toISOString() };
    const blogs = await loadJSON(BLOGS_FILE);
    blogs.push(blog);
    await saveJSON(BLOGS_FILE, blogs);
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await loadJSON(BLOGS_FILE);
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/blogs/:id', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    let blogs = await loadJSON(BLOGS_FILE);
    const idx = blogs.findIndex((b) => b.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Blog not found' });
    if (imageUrl != null) blogs[idx].imageUrl = imageUrl;
    await saveJSON(BLOGS_FILE, blogs);
    res.json(blogs[idx]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/blogs/:id', async (req, res) => {
  try {
    const blogId = req.params.id;
    let blogs = await loadJSON(BLOGS_FILE);
    const blog = blogs.find((b) => b.id === blogId);
    blogs = blogs.filter((b) => b.id !== blogId);
    await saveJSON(BLOGS_FILE, blogs);

    // Notify connected websites to remove this blog (so it disappears immediately)
    const websites = await loadJSON(WEBSITES_FILE);
    const axios = (await import('axios')).default;
    const payload = { id: blogId, topic: blog?.topic, createdAt: blog?.createdAt };
    for (const site of websites) {
      try {
        const url = `${site.url.replace(/\/$/, '')}/api/delete-blog?siteId=${site.id}`;
        await axios.post(url, payload, { timeout: 5000 });
      } catch (e) {
        console.warn('[Dashboard] Failed to notify', site.name, 'of delete:', e?.message);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Backfill all blogs with topic-related Unsplash images
app.post('/api/backfill-images', async (req, res) => {
  try {
    const blogs = await loadJSON(BLOGS_FILE);
    let updated = 0;
    for (const blog of blogs) {
      if (!hasTopicRelevantImage(blog.imageUrl)) {
        blog.imageUrl = await fetchTopicImageUrl(blog.topic);
        updated++;
      }
    }
    await saveJSON(BLOGS_FILE, blogs);
    res.json({ updated, total: blogs.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear all blogs on connected sites (sends empty list to replace-blogs)
app.post('/api/clear-site-blogs', async (req, res) => {
  try {
    const { websiteIds } = req.body;
    const websites = await loadJSON(WEBSITES_FILE);
    const targets = websites.filter((w) => websiteIds.includes(w.id));
    const axios = (await import('axios')).default;
    const results = [];
    for (const site of targets) {
      try {
        const url = `${site.url.replace(/\/$/, '')}/api/replace-blogs?siteId=${site.id}`;
        await axios.post(url, { blogs: [] }, { timeout: 10000 });
        results.push({ id: site.id, name: site.name, success: true });
      } catch (err) {
        results.push({ id: site.id, name: site.name, success: false });
      }
    }
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sync ALL saved blogs to websites (re-send everything - use when website was down or missing some)
app.post('/api/sync-all-blogs', async (req, res) => {
  try {
    const { websiteIds } = req.body;
    const blogs = await loadJSON(BLOGS_FILE);
    const websites = await loadJSON(WEBSITES_FILE);
    const targets = websites.filter(w => websiteIds.includes(w.id));
    const axios = (await import('axios')).default;

    for (const blog of blogs) {
      if (!hasTopicRelevantImage(blog.imageUrl)) {
        blog.imageUrl = await fetchTopicImageUrl(blog.topic);
      }
    }
    await saveJSON(BLOGS_FILE, blogs);

    const results = [];
    const payload = blogs.map((b) => ({
      id: b.id,
      topic: b.topic,
      category: b.category,
      content: b.content,
      metaTitle: b.metaTitle,
      metaDescription: b.metaDescription,
      imageData: b.imageData,
      imageUrl: b.imageUrl || null,
      keywords: b.keywords || [],
      createdAt: b.createdAt,
    }));
    for (const blog of payload) {
      if (!blog.imageUrl) blog.imageUrl = await fetchTopicImageUrl(blog.topic);
    }
    for (const site of targets) {
      let success = 0, failed = 0;
      try {
        const baseUrl = site.url.replace(/\/$/, '');
        const replaceUrl = `${baseUrl}/api/replace-blogs?siteId=${site.id}`;
        const replaceRes = await axios.post(replaceUrl, { blogs: payload }, { timeout: 30000, validateStatus: () => true });
        if (replaceRes.status === 200) {
          success = blogs.length;
        } else {
          throw new Error('Replace not supported');
        }
      } catch (err) {
        for (const blog of payload) {
          try {
            const apiUrl = `${site.url.replace(/\/$/, '')}/api/receive-blog?siteId=${site.id}`;
            await axios.post(apiUrl, blog, { timeout: 15000 });
            success++;
          } catch (e) {
            failed++;
          }
        }
      }
      results.push({ id: site.id, name: site.name, success, failed, total: blogs.length });
    }
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload to external websites - websites need to expose /api/receive-blog?siteId=XXX
app.post('/api/upload-to-websites', async (req, res) => {
  try {
    const { blog, websiteIds } = req.body;
    const websites = await loadJSON(WEBSITES_FILE);
    const targets = websites.filter(w => websiteIds.includes(w.id));
    const axios = (await import('axios')).default;

    let payload = { ...blog };
    if (!hasTopicRelevantImage(blog.imageUrl)) {
      payload.imageUrl = await fetchTopicImageUrl(blog.topic || 'travel');
    }

    const results = [];
    for (const site of targets) {
      try {
        const apiUrl = `${site.url.replace(/\/$/, '')}/api/receive-blog?siteId=${site.id}`;
        await axios.post(apiUrl, payload, { timeout: 10000 });
        results.push({ id: site.id, name: site.name, success: true });
      } catch (err) {
        results.push({ id: site.id, name: site.name, success: false, error: err.message });
      }
    }
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve built frontend in production (Docker / dist present)
const distDir = path.join(__dirname, '..', 'dist');
try {
  const stat = await fs.stat(distDir);
  if (stat?.isDirectory()) {
    app.use(express.static(distDir));
    app.get(/^(?!\/api\/).*$/, (req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }
} catch {}

app.listen(PORT, () => {
  const hasKey = !!process.env.GROQ_API_KEY?.trim();
  console.log(`SEO Dashboard API running at http://localhost:${PORT}`);
  console.log(hasKey ? '✓ GROQ_API_KEY loaded (Groq)' : '✗ GROQ_API_KEY not set. Get free key: console.groq.com');
});
