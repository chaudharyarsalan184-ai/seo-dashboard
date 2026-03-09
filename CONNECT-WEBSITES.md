# Connect Your Travel Websites to the SEO Dashboard

When you publish a blog from the dashboard, it sends a POST request to each connected website. Your site must have an endpoint to receive and store the blog.

---

## 1. Get Your Website ID

1. Go to **Websites** in the dashboard
2. Add your travel website (name + URL, e.g. `https://mytravelsite.com`)
3. Copy the **Unique ID** shown (e.g. `a1b2c3d4e5f6g7h8`)

---

## 2. Create the Receiver Endpoint

Your website must expose these endpoints:

### Required
```
POST https://your-travel-site.com/api/receive-blog?siteId=YOUR_WEBSITE_ID
Content-Type: application/json
```

### Recommended (for proper sync & delete support)
```
POST /api/replace-blogs?siteId=YOUR_WEBSITE_ID  - Replace all blogs (makes site match dashboard; use when syncing)
POST /api/delete-blog?siteId=YOUR_WEBSITE_ID   - Delete blog by id (Body: { "id": "uuid" })
```

**Request body (JSON):**
```json
{
  "topic": "Best Beaches in Goa",
  "category": "Destination Guides",
  "content": "<h1>...</h1><p>...</p><h2>...</h2>...",
  "metaTitle": "Best Beaches in Goa - Complete Guide 2025",
  "metaDescription": "Discover the best beaches in Goa...",
  "imageData": "data:image/svg+xml;base64,...",
  "keywords": ["goa beaches", "best beaches goa", ...]
}
```

---

## 3. Implementation Examples

### Option A: Node.js / Express (Next.js API route, Express, etc.)

Create a file or route that handles `POST /api/receive-blog`:

```javascript
// Example: Express or Next.js API route
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const siteId = req.query.siteId;
  const YOUR_SITE_ID = 'paste_your_id_here'; // From dashboard
  
  if (siteId !== YOUR_SITE_ID) {
    return res.status(403).json({ error: 'Invalid site ID' });
  }

  const { topic, category, content, metaTitle, metaDescription, imageData, keywords } = req.body;

  // Save to your database (example: MongoDB, PostgreSQL, etc.)
  // await db.blogs.create({ topic, category, content, metaTitle, metaDescription, imageData, keywords, createdAt: new Date() });

  // Or save to JSON file for simple sites:
  // const fs = require('fs');
  // const blogs = JSON.parse(fs.readFileSync('blogs.json', 'utf-8'));
  // blogs.push({ id: Date.now(), topic, category, content, metaTitle, metaDescription, imageData, keywords });
  // fs.writeFileSync('blogs.json', JSON.stringify(blogs, null, 2));

  res.json({ success: true, message: 'Blog received' });
}
```

### Option B: PHP (cPanel, shared hosting, WordPress)

Create `api/receive-blog.php`:

```php
<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  exit(json_encode(['error' => 'Method not allowed']));
}

$siteId = $_GET['siteId'] ?? '';
$YOUR_SITE_ID = 'paste_your_id_here';

if ($siteId !== $YOUR_SITE_ID) {
  http_response_code(403);
  exit(json_encode(['error' => 'Invalid site ID']));
}

$input = json_decode(file_get_contents('php://input'), true);
$blog = [
  'id' => time(),
  'topic' => $input['topic'] ?? '',
  'category' => $input['category'] ?? '',
  'content' => $input['content'] ?? '',
  'metaTitle' => $input['metaTitle'] ?? '',
  'metaDescription' => $input['metaDescription'] ?? '',
  'imageData' => $input['imageData'] ?? '',
  'keywords' => $input['keywords'] ?? [],
  'createdAt' => date('c'),
];

// Save to file (or use MySQL, etc.)
$file = __DIR__ . '/../data/blogs.json';
$blogs = file_exists($file) ? json_decode(file_get_contents($file), true) : [];
$blogs[] = $blog;
file_put_contents($file, json_encode($blogs, JSON_PRETTY_PRINT));

echo json_encode(['success' => true]);
```

### Option C: WordPress (functions.php or plugin)

Add to your theme's `functions.php` or a custom plugin:

```php
add_action('rest_api_init', function() {
  register_rest_route('custom/v1', '/receive-blog', [
    'methods' => 'POST',
    'callback' => 'seo_dashboard_receive_blog',
  ]);
});

function seo_dashboard_receive_blog($request) {
  $site_id = $request->get_param('siteId');
  $YOUR_SITE_ID = 'paste_your_id_here';
  
  if ($site_id !== $YOUR_SITE_ID) {
    return new WP_Error('forbidden', 'Invalid site ID', ['status' => 403]);
  }

  $body = $request->get_json_params();
  
  wp_insert_post([
    'post_title'   => $body['metaTitle'] ?? $body['topic'],
    'post_content' => $body['content'],
    'post_excerpt' => $body['metaDescription'] ?? '',
    'post_status'  => 'publish',
    'post_type'    => 'post',
  ]);

  return ['success' => true];
}
```

Then your receiver URL would be: `https://yoursite.com/wp-json/custom/v1/receive-blog?siteId=YOUR_ID`

---

## 4. Important Notes

- **HTTPS required**: Your site URL must be `https://` (not `http://`) for production
- **CORS**: If your site is on a different domain, ensure CORS allows POST from your dashboard
- **URL format**: Use the base URL without trailing slash: `https://mytravelsite.com`
- **Displaying blogs**: Use the `content` (HTML) and `metaTitle` for your blog page template
- **Image**: `imageData` is a base64 data URL—save as file or use directly in `<img src="...">`

---

## 5. Testing

After adding the endpoint, test from the dashboard:

1. Create a test blog
2. Select your website when choosing targets
3. Publish
4. Check the result—if it fails, the error message shows the issue (e.g. connection refused, 403, etc.)
