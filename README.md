# Travel SEO Dashboard

Dashboard to manage SEO activities across multiple travel websites. Create AI-powered blogs and auto-upload to your sites.

## Features

- **Website Management** - Add multiple travel websites, each with a unique ID for connection
- **Blog Creation** - Step-by-step: Select websites → Category → Topic → Keywords (AI) → Content (AI) → Uniqueness check → Publish
- **AI Content** - Meta title, description, full blog, and images via Google AI Studio (Gemini)
- **Plagiarism Check** - Shows how unique your content is before publishing
- **Auto Upload** - Blogs push to your websites automatically when you publish

## Setup

### 1. Get Google AI API Key (Free)

1. Go to [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
2. Create/sign in with Google
3. Create API key
4. Copy the key

### 2. Install & Run

```bash
cd seo-dashboard

# Install frontend deps (already done if created via template)
npm install

# Install server deps
cd server
npm install
cd ..
```

### 3. Start Backend (with API key)

Create a `.env` file in the **seo-dashboard** folder (same level as server):

```
GOOGLE_AI_API_KEY=your_key_here
```

Then run the server:
```bash
cd server
npm install
node index.js
```

**Or set env in PowerShell:**
```powershell
$env:GOOGLE_AI_API_KEY="your_key_here"
cd server
node index.js
```

### 4. Start Frontend

In a new terminal:
```bash
cd seo-dashboard
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Connect Your Websites

Each website needs an endpoint to receive blogs:

```
POST /api/receive-blog?siteId=YOUR_SITE_ID
Body: { topic, category, content, metaTitle, metaDescription, imageData, keywords }
```

When adding a website in the dashboard, copy its **Unique ID**. Your site must verify `siteId` matches before accepting the blog.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS
- Express backend
- Google Generative AI (Gemini 2.0 Flash)
