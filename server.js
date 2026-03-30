const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs').promises;

const DATA_DIR = path.join(__dirname, 'data');
const BLOG_DIR = path.join(__dirname, 'blog');
const IMAGES_DIR = path.join(__dirname, 'public', 'images');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    console.error(`Error creating directory ${dirPath}:`, err);
  }
}

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

// Save base64-encoded image file and return path
async function saveImageFile(base64Data, folder, filename) {
  try {
    const folderPath = path.join(IMAGES_DIR, folder);
    await ensureDir(folderPath);
    
    // Extract base64 data (remove data:image/...;base64, prefix if present)
    const buffer = Buffer.from(
      base64Data.replace(/^data:image\/[a-z]+;base64,/, ''),
      'base64'
    );
    
    const filePath = path.join(folderPath, filename);
    await fs.writeFile(filePath, buffer);
    
    return `/images/${folder}/${filename}`;
  } catch (err) {
    console.error('Error saving image file:', err);
    throw err;
  }
}

const REVIEWS_FILE       = path.join(DATA_DIR, 'reviews.json');
const CONTACTS_FILE      = path.join(DATA_DIR, 'contacts.json');
const NEWS_FILE          = path.join(DATA_DIR, 'newsletter.json');
const IMAGES_FILE        = path.join(DATA_DIR, 'images.json');
const IMAGES_MANIFEST    = path.join(DATA_DIR, 'images-manifest.json');

ensureFile(REVIEWS_FILE,  []);
ensureFile(CONTACTS_FILE, []);
ensureFile(NEWS_FILE,     []);
ensureFile(IMAGES_FILE,   { images: [] });

// Initialize manifest with default structure
const defaultManifest = {
  version: "1.0",
  lastUpdated: new Date().toISOString(),
  heroImages: [],
  gallery: {
    resort: [],
    hotel: [],
    activities: [],
    nature: [],
    bird: []
  },
  blogImages: [],
  metadata: {
    totalImages: 0,
    totalActiveImages: 0,
    categories: ["resort", "hotel", "activities", "nature", "bird"],
    lastModified: new Date().toISOString()
  }
};
ensureFile(IMAGES_MANIFEST, defaultManifest);

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

// Images - Manifest
app.get('/api/images/manifest', async (req, res) => {
  const manifest = await readJSON(IMAGES_MANIFEST, defaultManifest);
  res.json(manifest);
});

// Hero Images
app.get('/api/images/hero', async (req, res) => {
  const manifest = await readJSON(IMAGES_MANIFEST, defaultManifest);
  const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : null;
  let heroes = manifest.heroImages || [];
  if (active !== null) heroes = heroes.filter(h => h.active === active);
  res.json({ heroImages: heroes.sort((a, b) => (a.order || 0) - (b.order || 0)) });
});

app.post('/api/images/hero', async (req, res) => {
  const { filename, imageData } = req.body;
  if (!filename || !imageData) return res.status(400).json({ error: 'filename and imageData required' });
  
  try {
    // Save the actual image file
    const imgPath = await saveImageFile(imageData, 'hero', filename);
    
    const manifest = await readJSON(IMAGES_MANIFEST, defaultManifest);
    const nextOrder = manifest.heroImages.length > 0 
      ? Math.max(...manifest.heroImages.map(h => h.order || 0)) + 1 
      : 1;
    
    const newHero = {
      id: 'hero_' + Date.now(),
      filename,
      path: imgPath,
      active: true,
      order: nextOrder,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    manifest.heroImages.push(newHero);
    manifest.lastUpdated = new Date().toISOString();
    manifest.metadata.totalImages = (manifest.heroImages || []).length + 
                                     Object.values(manifest.gallery || {}).reduce((sum, arr) => sum + arr.length, 0) +
                                     (manifest.blogImages || []).length;
    manifest.metadata.totalActiveImages = (manifest.heroImages || []).filter(h => h.active).length +
                                           Object.values(manifest.gallery || {}).flat().filter(g => g.active).length +
                                           (manifest.blogImages || []).filter(b => b.active).length;
    
    await writeJSON(IMAGES_MANIFEST, manifest);
    res.json({ success: true, image: newHero });
  } catch (err) {
    console.error('Error uploading hero image:', err);
    res.status(500).json({ error: 'Failed to upload image: ' + err.message });
  }
});

app.put('/api/images/hero/:id', async (req, res) => {
  const { active, order } = req.body;
  const manifest = await readJSON(IMAGES_MANIFEST, defaultManifest);
  
  const hero = manifest.heroImages.find(h => h.id === req.params.id);
  if (!hero) return res.status(404).json({ error: 'Hero image not found' });
  
  if (active !== undefined) hero.active = active;
  if (order !== undefined) hero.order = order;
  hero.updatedAt = new Date().toISOString();
  
  manifest.lastUpdated = new Date().toISOString();
  manifest.metadata.totalActiveImages = (manifest.heroImages || []).filter(h => h.active).length +
                                         Object.values(manifest.gallery || {}).flat().filter(g => g.active).length +
                                         (manifest.blogImages || []).filter(b => b.active).length;
  
  await writeJSON(IMAGES_MANIFEST, manifest);
  res.json({ success: true, image: hero });
});

app.delete('/api/images/hero/:id', async (req, res) => {
  const manifest = await readJSON(IMAGES_MANIFEST, defaultManifest);
  manifest.heroImages = manifest.heroImages.filter(h => h.id !== req.params.id);
  manifest.lastUpdated = new Date().toISOString();
  manifest.metadata.totalImages = (manifest.heroImages || []).length + 
                                   Object.values(manifest.gallery || {}).reduce((sum, arr) => sum + arr.length, 0) +
                                   (manifest.blogImages || []).length;
  manifest.metadata.totalActiveImages = (manifest.heroImages || []).filter(h => h.active).length +
                                         Object.values(manifest.gallery || {}).flat().filter(g => g.active).length +
                                         (manifest.blogImages || []).filter(b => b.active).length;
  
  await writeJSON(IMAGES_MANIFEST, manifest);
  res.json({ success: true });
});

// Gallery Images
app.get('/api/images/gallery', async (req, res) => {
  const manifest = await readJSON(IMAGES_MANIFEST, defaultManifest);
  const category = req.query.category;
  const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : null;
  
  // Flatten all categories into a single array for the frontend
  let galleryImages = [];
  
  if (category) {
    // Specific category requested
    if (manifest.gallery[category]) {
      let images = manifest.gallery[category];
      if (active !== null) images = images.filter(g => g.active === active);
      galleryImages = images.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
  } else {
    // All categories - flatten into single array
    for (const cat in manifest.gallery) {
      let images = manifest.gallery[cat] || [];
      if (active !== null) images = images.filter(g => g.active === active);
      galleryImages = galleryImages.concat(images.sort((a, b) => (a.order || 0) - (b.order || 0)));
    }
  }
  
  res.json({ galleryImages });
});

app.post('/api/images/gallery', async (req, res) => {
  const { category, filename, imageData } = req.body;
  if (!category || !filename || !imageData) 
    return res.status(400).json({ error: 'category, filename and imageData required' });
  
  try {
    // Save the actual image file
    const imgPath = await saveImageFile(imageData, `gallery/${category}`, filename);
    
    const manifest = await readJSON(IMAGES_MANIFEST, defaultManifest);
    
    if (!manifest.gallery[category]) {
      manifest.gallery[category] = [];
    }
    
    const nextOrder = manifest.gallery[category].length > 0
      ? Math.max(...manifest.gallery[category].map(g => g.order || 0)) + 1
      : 1;
    
    const newImage = {
      id: 'gal_' + category + '_' + Date.now(),
      filename,
      path: imgPath,
      category,
      active: true,
      order: nextOrder,
      createdAt: new Date().toISOString()
    };
    
    manifest.gallery[category].push(newImage);
    manifest.lastUpdated = new Date().toISOString();
    manifest.metadata.totalImages = (manifest.heroImages || []).length + 
                                     Object.values(manifest.gallery || {}).reduce((sum, arr) => sum + arr.length, 0) +
                                     (manifest.blogImages || []).length;
    manifest.metadata.totalActiveImages = (manifest.heroImages || []).filter(h => h.active).length +
                                           Object.values(manifest.gallery || {}).flat().filter(g => g.active).length +
                                           (manifest.blogImages || []).filter(b => b.active).length;
    
    await writeJSON(IMAGES_MANIFEST, manifest);
    res.json({ success: true, image: newImage });
  } catch (err) {
    console.error('Error uploading gallery image:', err);
    res.status(500).json({ error: 'Failed to upload image: ' + err.message });
  }
});

app.put('/api/images/gallery/:id', async (req, res) => {
  const { active, order, category } = req.body;
  const manifest = await readJSON(IMAGES_MANIFEST, defaultManifest);
  
  if (!category || !manifest.gallery[category]) {
    return res.status(400).json({ error: 'category required' });
  }
  
  const image = manifest.gallery[category].find(g => g.id === req.params.id);
  if (!image) return res.status(404).json({ error: 'Gallery image not found' });
  
  if (active !== undefined) image.active = active;
  if (order !== undefined) image.order = order;
  
  manifest.lastUpdated = new Date().toISOString();
  manifest.metadata.totalActiveImages = (manifest.heroImages || []).filter(h => h.active).length +
                                         Object.values(manifest.gallery || {}).flat().filter(g => g.active).length +
                                         (manifest.blogImages || []).filter(b => b.active).length;
  
  await writeJSON(IMAGES_MANIFEST, manifest);
  res.json({ success: true, image });
});

app.delete('/api/images/gallery/:id', async (req, res) => {
  const { category } = req.body;
  if (!category) return res.status(400).json({ error: 'category required' });
  
  const manifest = await readJSON(IMAGES_MANIFEST, defaultManifest);
  
  if (!manifest.gallery[category]) {
    return res.status(404).json({ error: 'Category not found' });
  }
  
  manifest.gallery[category] = manifest.gallery[category].filter(g => g.id !== req.params.id);
  manifest.lastUpdated = new Date().toISOString();
  manifest.metadata.totalImages = (manifest.heroImages || []).length + 
                                   Object.values(manifest.gallery || {}).reduce((sum, arr) => sum + arr.length, 0) +
                                   (manifest.blogImages || []).length;
  manifest.metadata.totalActiveImages = (manifest.heroImages || []).filter(h => h.active).length +
                                         Object.values(manifest.gallery || {}).flat().filter(g => g.active).length +
                                         (manifest.blogImages || []).filter(b => b.active).length;
  
  await writeJSON(IMAGES_MANIFEST, manifest);
  res.json({ success: true });
});

// Blog Images
app.get('/api/images/blog', async (req, res) => {
  const manifest = await readJSON(IMAGES_MANIFEST, defaultManifest);
  const active = req.query.active === 'true' ? true : req.query.active === 'false' ? false : null;
  let blogs = manifest.blogImages || [];
  if (active !== null) blogs = blogs.filter(b => b.active === active);
  res.json({ blogImages: blogs });
});

app.post('/api/images/blog', async (req, res) => {
  const { postId, filename, imageData } = req.body;
  if (!postId || !filename || !imageData) 
    return res.status(400).json({ error: 'postId, filename and imageData required' });
  
  try {
    // Save the actual image file
    const imgPath = await saveImageFile(imageData, `blog/${postId}`, filename);
    
    const manifest = await readJSON(IMAGES_MANIFEST, defaultManifest);
    
    const newImage = {
      id: 'blog_' + postId + '_' + Date.now(),
      postId,
      filename,
      path: imgPath,
      active: true,
      createdAt: new Date().toISOString()
    };
    
    manifest.blogImages.push(newImage);
    manifest.lastUpdated = new Date().toISOString();
    manifest.metadata.totalImages = (manifest.heroImages || []).length + 
                                     Object.values(manifest.gallery || {}).reduce((sum, arr) => sum + arr.length, 0) +
                                     (manifest.blogImages || []).length;
    manifest.metadata.totalActiveImages = (manifest.heroImages || []).filter(h => h.active).length +
                                           Object.values(manifest.gallery || {}).flat().filter(g => g.active).length +
                                           (manifest.blogImages || []).filter(b => b.active).length;
    
    await writeJSON(IMAGES_MANIFEST, manifest);
    res.json({ success: true, image: newImage });
  } catch (err) {
    console.error('Error uploading blog image:', err);
    res.status(500).json({ error: 'Failed to upload image: ' + err.message });
  }
});

app.put('/api/images/blog/:id', async (req, res) => {
  const { active } = req.body;
  const manifest = await readJSON(IMAGES_MANIFEST, defaultManifest);
  
  const image = manifest.blogImages.find(b => b.id === req.params.id);
  if (!image) return res.status(404).json({ error: 'Blog image not found' });
  
  if (active !== undefined) image.active = active;
  
  manifest.lastUpdated = new Date().toISOString();
  manifest.metadata.totalActiveImages = (manifest.heroImages || []).filter(h => h.active).length +
                                         Object.values(manifest.gallery || {}).flat().filter(g => g.active).length +
                                         (manifest.blogImages || []).filter(b => b.active).length;
  
  await writeJSON(IMAGES_MANIFEST, manifest);
  res.json({ success: true, image });
});

app.delete('/api/images/blog/:id', async (req, res) => {
  const manifest = await readJSON(IMAGES_MANIFEST, defaultManifest);
  manifest.blogImages = manifest.blogImages.filter(b => b.id !== req.params.id);
  manifest.lastUpdated = new Date().toISOString();
  manifest.metadata.totalImages = (manifest.heroImages || []).length + 
                                   Object.values(manifest.gallery || {}).reduce((sum, arr) => sum + arr.length, 0) +
                                   (manifest.blogImages || []).length;
  manifest.metadata.totalActiveImages = (manifest.heroImages || []).filter(h => h.active).length +
                                         Object.values(manifest.gallery || {}).flat().filter(g => g.active).length +
                                         (manifest.blogImages || []).filter(b => b.active).length;
  
  await writeJSON(IMAGES_MANIFEST, manifest);
  res.json({ success: true });
});

// Legacy Images (kept for backward compatibility)
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