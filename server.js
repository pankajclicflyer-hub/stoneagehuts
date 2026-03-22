const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const DATA_DIR = path.join(__dirname, 'data');
const BLOG_DIR = path.join(__dirname, 'blog');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

async function ensureFile(filePath, defaultContent) {
  try {
    await fs.access(filePath);
  } catch (err) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2));
  }
}

async function readJSON(filePath, fallback = []) {
  try {
    const txt = await fs.readFile(filePath, 'utf8');
    return JSON.parse(txt || '[]');
  } catch (e) {
    return fallback;
  }
}

async function writeJSON(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

const REVIEWS_FILE  = path.join(DATA_DIR, 'reviews.json');
const CONTACTS_FILE = path.join(DATA_DIR, 'contacts.json');
const NEWS_FILE     = path.join(DATA_DIR, 'newsletter.json');
const IMAGES_FILE   = path.join(DATA_DIR, 'images.json');

ensureFile(REVIEWS_FILE,  []);
ensureFile(CONTACTS_FILE, []);
ensureFile(NEWS_FILE,     []);
ensureFile(IMAGES_FILE,   { images: [] });

// Reviews
app.get('/api/reviews', async (req, res) => {
  const reviews = await readJSON(REVIEWS_FILE, []);
  res.json(reviews);
});

app.post('/api/reviews', async (req, res) => {
  const { name, rating, text } = req.body;
  if (!name || !rating) return res.status(400).json({ error: 'Name and rating required' });
  const reviews = await readJSON(REVIEWS_FILE, []);
  const id = reviews.length ? Math.max(...reviews.map(r => r.id)) + 1 : 1;
  const item = { id, name, rating: Number(rating), text: text || '', date: new Date().toISOString().slice(0, 10) };
  reviews.push(item);
  await writeJSON(REVIEWS_FILE, reviews);
  res.json(item);
});

// Contact
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  const contacts = await readJSON(CONTACTS_FILE, []);
  const id = contacts.length ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
  const item = { id, name, email, message: message || '', date: new Date().toISOString() };
  contacts.push(item);
  await writeJSON(CONTACTS_FILE, contacts);
  res.json({ success: true });
});

// Newsletter
app.post('/api/newsletter', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const list = await readJSON(NEWS_FILE, []);
  if (!list.find(e => e.email === email)) {
    list.push({ email, date: new Date().toISOString() });
    await writeJSON(NEWS_FILE, list);
  }
  res.json({ success: true });
});

// Blog
app.get('/api/blog', async (req, res) => {
  const lang = (req.query.lang || 'english').toLowerCase();
  const file = path.join(BLOG_DIR, lang === 'hindi' ? 'hindi' : 'english', 'posts.json');
  const posts = await readJSON(file, []);
  res.json(posts);
});

// Images
app.get('/api/images', async (req, res) => {
  const data = await readJSON(IMAGES_FILE, { images: [] });
  const folder = req.query.folder;
  if (folder) data.images = data.images.filter(img => img.folder === folder);
  res.json(data);
});

app.post('/api/images', async (req, res) => {
  const { name, folder, path: imgPath, size, type } = req.body;
  if (!name || !imgPath) return res.status(400).json({ error: 'name and path required' });
  const data = await readJSON(IMAGES_FILE, { images: [] });
  const newImg = {
    id: Date.now().toString(),
    name,
    folder: folder || 'root',
    path: imgPath,
    size,
    type,
    uploadedAt: new Date().toISOString()
  };
  data.images.push(newImg);
  await writeJSON(IMAGES_FILE, data);
  res.json({ success: true, image: newImg });
});

app.delete('/api/images/:id', async (req, res) => {
  const data = await readJSON(IMAGES_FILE, { images: [] });
  data.images = data.images.filter(img => img.id !== req.params.id);
  await writeJSON(IMAGES_FILE, data);
  res.json({ success: true });
});

// Admin panel
app.get(['/admin', '/admin/login'], (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port ' + PORT));