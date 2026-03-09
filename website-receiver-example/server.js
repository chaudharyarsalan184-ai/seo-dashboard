/**
 * AVP Holidays - Travel blog site
 * Receives blogs from SEO Dashboard. Sync & delete supported.
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Must match Website ID from SEO dashboard (Websites page)
const YOUR_SITE_ID = 'f1029556a584457b';

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const BLOGS_FILE = path.join(__dirname, 'blogs.json');

function loadBlogs() {
  try {
    return JSON.parse(fs.readFileSync(BLOGS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveBlogs(blogs) {
  fs.writeFileSync(BLOGS_FILE, JSON.stringify(blogs, null, 2));
}

app.post('/api/receive-blog', (req, res) => {
  const siteId = req.query.siteId;
  
  if (siteId !== YOUR_SITE_ID) {
    return res.status(403).json({ error: 'Invalid site ID' });
  }

  const blog = {
    id: Date.now().toString(),
    ...req.body,
    receivedAt: new Date().toISOString(),
  };

  const blogs = loadBlogs();
  blogs.push(blog);
  saveBlogs(blogs);

  console.log(`Blog received: ${blog.topic}`);
  res.json({ success: true, id: blog.id });
});

app.get('/api/blogs', (req, res) => {
  res.json(loadBlogs());
});

// Replace all blogs (use when syncing - makes site match dashboard exactly)
app.post('/api/replace-blogs', (req, res) => {
  const siteId = req.query.siteId;
  if (siteId !== YOUR_SITE_ID) {
    return res.status(403).json({ error: 'Invalid site ID' });
  }
  const { blogs } = req.body;
  const list = Array.isArray(blogs) ? blogs.map((b) => ({ ...b, receivedAt: new Date().toISOString() })) : [];
  saveBlogs(list);
  console.log(`Replaced with ${list.length} blog(s)`);
  res.json({ success: true });
});

app.post('/api/delete-blog', (req, res) => {
  const siteId = req.query.siteId;
  if (siteId !== YOUR_SITE_ID) {
    return res.status(403).json({ error: 'Invalid site ID' });
  }
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: 'Missing blog id' });
  const blogs = loadBlogs().filter((b) => b.id !== id);
  saveBlogs(blogs);
  console.log(`Blog deleted: ${id}`);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Blog receiver running on port ${PORT}`);
  console.log(`  POST /api/receive-blog?siteId=... - add blog`);
  console.log(`  POST /api/replace-blogs?siteId=... - replace all (sync with deletions)`);
  console.log(`  POST /api/delete-blog?siteId=... - delete blog by id`);
});
