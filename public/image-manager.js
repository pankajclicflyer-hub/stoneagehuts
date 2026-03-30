/**
 * Image Manager JS
 * Handles hero, gallery, and blog image management from JSON manifest
 */

const IMG_API = '/api/images';

// ═══════════════════════════════════════════════════════════
// HERO IMAGE MANAGEMENT
// ═══════════════════════════════════════════════════════════

async function loadHeroImages() {
  try {
    const res = await fetch(`${IMG_API}/hero`);
    const data = await res.json();
    const heroes = data.heroImages || [];
    const list = document.getElementById('hero-list');
    const count = document.getElementById('hero-count');
    
    count.textContent = `Total: ${heroes.length}`;
    
    if (!heroes.length) {
      list.innerHTML = '<div class="empty-state"><i class="fas fa-image"></i><p>No hero images yet. Upload one to get started!</p></div>';
      return;
    }
    
    list.innerHTML = heroes.map(hero => `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:1rem;margin-bottom:1rem;display:flex;gap:1rem;align-items:start;">
        <div style="flex:0 0 120px;aspect-ratio:16/9;border-radius:8px;overflow:hidden;background:var(--bg);">
          <img src="${hero.path}" alt="${hero.filename}" style="width:100%;height:100%;object-fit:cover;" 
            onerror="this.src='https://via.placeholder.com/320x180?text=Not+Available'" />
        </div>
        <div style="flex:1;min-width:0;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:0.75rem;">
            <div>
              <p style="font-weight:600;margin-bottom:0.25rem;">${hero.filename}</p>
              <p style="font-size:0.8rem;color:var(--muted);">Order: ${hero.order} | Id: ${hero.id.slice(0,8)}...</p>
              <p style="font-size:0.75rem;color:var(--muted);margin-top:0.25rem;">Created: ${new Date(hero.createdAt).toLocaleDateString()}</p>
            </div>
            <span class="badge ${hero.active ? 'badge-published' : 'badge-draft'}">${hero.active ? 'Active' : 'Inactive'}</span>
          </div>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            <select id="order-${hero.id}" value="${hero.order}" style="background:var(--card);border:1px solid var(--border);color:var(--text);padding:0.4rem 0.7rem;border-radius:7px;font-family:inherit;font-size:0.8rem;">
              <option value="1">1 - First</option>
              <option value="2">2 - Second</option>
              <option value="3">3 - Third</option>
              <option value="4">4 - Fourth</option>
              <option value="5">5 - Fifth</option>
            </select>
            <button class="btn btn-sm ${hero.active ? 'btn-approve' : 'btn-outline'}" onclick="toggleHeroActive('${hero.id}', ${!hero.active})" style="flex:1;">
              <i class="fas fa-${hero.active ? 'eye' : 'eye-slash'}"></i> ${hero.active ? 'Active' : 'Inactive'}
            </button>
            <button class="btn btn-sm btn-danger" onclick="deleteHeroImage('${hero.id}')"><i class="fas fa-trash"></i> Delete</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch(e) {
    console.error('Error loading hero images:', e);
    document.getElementById('hero-list').innerHTML = '<div class="empty-state"><p>Error loading images</p></div>';
  }
}

window.handleHeroImageFile = async function(file) {
  if (!file) return;
  
  // Validate file
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast('Only JPG, PNG, WebP formats allowed', 'error');
    return;
  }
  
  if (file.size > 5 * 1024 * 1024) {
    toast('File size must be less than 5MB', 'error');
    return;
  }
  
  const progEl = document.getElementById('hero-progress');
  const fillEl = document.getElementById('hero-prog-fill');
  progEl.style.display = 'block';
  
  try {
    // Convert file to data URL
    const reader = new FileReader();
    reader.onload = async function(e) {
      const dataUrl = e.target.result;
      const filename = `hero_${Date.now()}_${file.name}`;
      
      try {
        // Save to manifest with image data
        const res = await fetch(`${IMG_API}/hero`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: filename,
            imageData: dataUrl
          })
        });
        
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Upload failed');
        }
        
        fillEl.style.width = '100%';
        toast('✅ Hero image added! It will display on the website now.');
        loadHeroImages();
        
        // Reset input
        document.getElementById('hero-file').value = '';
      } catch(err) {
        toast('Error uploading hero image: ' + err.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  } catch(e) {
    toast('Error reading file: ' + e.message, 'error');
  } finally {
    progEl.style.display = 'none';
    fillEl.style.width = '0%';
  }
};

window.toggleHeroActive = async function(id, active) {
  try {
    const res = await fetch(`${IMG_API}/hero/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active })
    });
    if (!res.ok) throw new Error('Update failed');
    toast(active ? 'Image activated!' : 'Image deactivated!');
    loadHeroImages();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  }
};

window.deleteHeroImage = async function(id) {
  if (!confirm('Delete this hero image? This cannot be undone.')) return;
  try {
    const res = await fetch(`${IMG_API}/hero/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    toast('Hero image deleted');
    loadHeroImages();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  }
};

window.loadCurrentHero = loadHeroImages;

// ═══════════════════════════════════════════════════════════
// GALLERY IMAGE MANAGEMENT
// ═══════════════════════════════════════════════════════════

let pendingGalleryFiles = [];

window.handleGalleryFiles = function(files) {
  pendingGalleryFiles = Array.from(files);
  const preview = document.getElementById('gal-preview');
  
  preview.innerHTML = pendingGalleryFiles.map((f, i) => {
    const url = URL.createObjectURL(f);
    return `<div class="preview-item">
      <img src="${url}" />
      <button class="remove" onclick="removeGalFile(${i})">×</button>
    </div>`;
  }).join('');
  
  document.getElementById('gal-upload-btn').disabled = !pendingGalleryFiles.length;
};

window.removeGalFile = function(i) {
  pendingGalleryFiles.splice(i, 1);
  window.handleGalleryFiles(pendingGalleryFiles);
};

window.uploadGalleryImages = async function() {
  if (!pendingGalleryFiles.length) {
    toast('Please select images to upload', 'error');
    return;
  }
  
  const category = document.getElementById('gal-category').value;
  if (!category) {
    toast('Please select a category', 'error');
    return;
  }
  
  const prog = document.getElementById('gal-progress');
  const label = document.getElementById('gal-prog-label');
  const fill = document.getElementById('gal-prog-fill');
  const uploadBtn = document.getElementById('gal-upload-btn');
  
  uploadBtn.disabled = true;
  prog.style.display = 'block';
  
  try {
    for (let i = 0; i < pendingGalleryFiles.length; i++) {
      const file = pendingGalleryFiles[i];
      
      // Validate
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast(`File ${file.name} is not a valid image format`, 'error');
        continue;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        toast(`File ${file.name} is too large (max 5MB)`, 'error');
        continue;
      }
      
      label.textContent = `Uploading ${i + 1}/${pendingGalleryFiles.length}: ${file.name}`;
      fill.style.width = '0%';
      
      // Read as data URL and upload
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const filename = `gal_${category}_${Date.now()}_${i}_${file.name}`;
      
      const res = await fetch(`${IMG_API}/gallery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: category,
          filename: filename,
          imageData: dataUrl
        })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Upload failed');
      }
      
      fill.style.width = (((i + 1) / pendingGalleryFiles.length) * 100) + '%';
    }
    
    toast(`✅ ${pendingGalleryFiles.length} image(s) uploaded successfully!`);
  } catch(e) {
    toast('Gallery upload failed: ' + e.message, 'error');
  } finally {
    pendingGalleryFiles = [];
    document.getElementById('gal-preview').innerHTML = '';
    uploadBtn.disabled = true;
    prog.style.display = 'none';
    fill.style.width = '0%';
    loadGalleryAdmin();
  }
};

async function loadGalleryAdmin() {
  const grid = document.getElementById('admin-gallery-grid');
  const stats = document.getElementById('gallery-stats');
  grid.innerHTML = '<div class="spinner"></div>';
  
  try {
    const category = document.getElementById('gal-filter-cat').value;
    const url = category === 'all' 
      ? `${IMG_API}/gallery`
      : `${IMG_API}/gallery?category=${category}`;
    
    const res = await fetch(url);
    const data = await res.json();
    
    // Extract gallery images from API response
    const allImages = data.galleryImages || [];
    
    const activeCount = allImages.filter(img => img.active).length;
    const totalCount = allImages.length;
    
    if (stats) {
      stats.innerHTML = `<strong style="color:var(--text);">${totalCount}</strong> total images | <strong style="color:var(--moss);">${activeCount}</strong> active`;
    }
    
    if (!allImages.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><i class="fas fa-images"></i><p>No images in this category</p></div>';
      return;
    }
    
    grid.innerHTML = allImages.map(img => `
      <div class="admin-gallery-item">
        <img src="${img.path}" alt="${img.filename}" loading="lazy" 
          onerror="this.src='https://via.placeholder.com/320x240?text=Not+Available'" />
        <div class="item-overlay">
          <button class="btn btn-sm btn-approve" onclick="toggleGalleryActive('${img.id}', ${!img.active}, '${category}')">
            <i class="fas fa-${img.active ? 'eye' : 'eye-slash'}"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteGalleryImage('${img.id}', '${category}')">
            <i class="fas fa-trash"></i>
          </button>
        </div>
        <div class="item-label">
          ${img.filename.slice(0, 20)}... 
          <span style="opacity:0.6;margin-left:0.25rem;${img.active ? '' : 'opacity:0.4;'};">
            <i class="fas fa-${img.active ? 'eye' : 'eye-slash'}"></i>
          </span>
        </div>
      </div>
    `).join('');
  } catch(e) {
    console.error('Error loading gallery:', e);
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><p>Error loading images</p></div>';
  }
}

window.loadGalleryAdmin = loadGalleryAdmin;

window.toggleGalleryActive = async function(id, active, category) {
  try {
    const res = await fetch(`${IMG_API}/gallery/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active, category })
    });
    if (!res.ok) throw new Error('Update failed');
    toast(active ? 'Image activated!' : 'Image deactivated!');
    loadGalleryAdmin();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  }
};

window.deleteGalleryImage = async function(id, category) {
  if (!confirm('Delete this image? This cannot be undone.')) return;
  try {
    const res = await fetch(`${IMG_API}/gallery/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    });
    if (!res.ok) throw new Error('Delete failed');
    toast('Image deleted');
    loadGalleryAdmin();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  }
};

// Drag & drop for gallery
const galDrop = document.getElementById('gal-drop');
if (galDrop) {
  ['dragover', 'dragleave', 'drop'].forEach(ev => galDrop.addEventListener(ev, e => {
    e.preventDefault();
    if (ev === 'dragover') galDrop.classList.add('drag');
    if (ev === 'dragleave') galDrop.classList.remove('drag');
    if (ev === 'drop') {
      galDrop.classList.remove('drag');
      window.handleGalleryFiles(e.dataTransfer.files);
    }
  }));
}

// ═══════════════════════════════════════════════════════════
// BLOG IMAGE MANAGEMENT
// ═══════════════════════════════════════════════════════════

async function loadBlogImages() {
  try {
    const res = await fetch(`${IMG_API}/blog`);
    const images = await res.json();
    const list = document.getElementById('blog-images-list');
    
    if (!images.length) {
      list.innerHTML = '<div class="empty-state"><i class="fas fa-image"></i><p>No blog images yet</p></div>';
      return;
    }
    
    list.innerHTML = images.map(img => `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:0.75rem;margin-bottom:0.75rem;display:flex;gap:0.75rem;align-items:center;">
        <div style="flex:0 0 80px;aspect-ratio:4/3;border-radius:6px;overflow:hidden;background:var(--bg);">
          <img src="${img.path}" alt="${img.filename}" style="width:100%;height:100%;object-fit:cover;" 
            onerror="this.src='https://via.placeholder.com/240x180?text=Not+Available'" />
        </div>
        <div style="flex:1;min-width:0;">
          <p style="font-weight:600;font-size:0.9rem;margin-bottom:0.25rem;">Post: ${img.postId}</p>
          <p style="font-size:0.8rem;color:var(--muted);">${img.filename}</p>
        </div>
        <span class="badge ${img.active ? 'badge-published' : 'badge-draft'}">${img.active ? 'Active' : 'Inactive'}</span>
        <button class="btn btn-sm btn-danger" onclick="deleteBlogImage('${img.id}')"><i class="fas fa-trash"></i></button>
      </div>
    `).join('');
  } catch(e) {
    console.error('Error loading blog images:', e);
    document.getElementById('blog-images-list').innerHTML = '<div class="empty-state"><p>Error loading images</p></div>';
  }
}

window.deleteBlogImage = async function(id) {
  if (!confirm('Delete this blog image?')) return;
  try {
    const res = await fetch(`${IMG_API}/blog/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    toast('Blog image deleted');
    loadBlogImages();
  } catch(e) {
    toast('Error: ' + e.message, 'error');
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  const pathname = window.location.pathname;
  if (pathname.includes('admin')) {
    // Images will be loaded when pages are shown via showPage()
  }
});
