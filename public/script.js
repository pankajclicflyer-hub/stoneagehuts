const translations = {
  en: {
    homeTitle: "Experience Nature's Embrace",
    homeSub: 'Resort • Hostel • Bird Watching Retreat',
    stayTitle: 'Our Accommodations',
    activitiesTitle: 'Activities & Experiences',
    galleryTitle: 'Image Gallery',
    reviewsTitle: 'Guest Reviews',
    contactTitle: 'Contact Us',
    bookNow: 'Book Now',
    inquire: 'Book / Enquire',
    socials: ['Instagram','Twitter','Facebook','TripAdvisor','YouTube']
  },
  hi: {
    homeTitle: 'प्रकृति की गोद का अनुभव करें',
    homeSub: 'रिसॉर्ट • हॉस्टल • बर्ड वॉचिंग रिट्रीट',
    stayTitle: 'हमारी आवास सुविधा',
    activitiesTitle: 'गतिविधियाँ और अनुभव',
    galleryTitle: 'छवि गैलरी',
    reviewsTitle: 'अतिथि समीक्षाएँ',
    contactTitle: 'संपर्क करें',
    bookNow: 'बुक करें',
    inquire: 'बुक / पूछताछ',
    socials: ['इंस्टाग्राम','ट्विटर','फेसबुक','ट्रिपएडवाइज़र','यूट्यूब']
  }
};

let lang = 'en';
function applyTranslations() {
  document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
  document.documentElement.dir = lang === 'hi' ? 'rtl' : 'ltr';
  document.getElementById('btn-en').classList.toggle('active', lang === 'en');
  document.getElementById('btn-hi').classList.toggle('active', lang === 'hi');
  document.querySelector('.hero-title').textContent = translations[lang].homeTitle;
  document.querySelector('.hero-sub').textContent = translations[lang].homeSub;
  document.querySelector('#stay .section-title').textContent = translations[lang].stayTitle;
  document.querySelector('#activities .section-title').textContent = translations[lang].activitiesTitle;
  document.querySelector('#gallery .section-title').textContent = translations[lang].galleryTitle;
  document.querySelector('#reviews .section-title').textContent = translations[lang].reviewsTitle;
  document.querySelector('#contact .section-title').textContent = translations[lang].contactTitle;
  document.querySelectorAll('.inquire').forEach(b=>b.textContent = translations[lang].inquire);
  document.querySelectorAll('.btn.primary').forEach(b=>b.textContent = translations[lang].bookNow);
}

document.getElementById('btn-en').addEventListener('click', ()=>{lang='en';applyTranslations();fetchBlog();});
document.getElementById('btn-hi').addEventListener('click', ()=>{lang='hi';applyTranslations();fetchBlog();});

// Smooth scrolling / scroll-spy
const navLinks = document.querySelectorAll('.nav-link');
const sections = Array.from(document.querySelectorAll('main section'));
navLinks.forEach(a=>{
  a.addEventListener('click', (e)=>{
    navLinks.forEach(n=>n.classList.remove('active'));
    a.classList.add('active');
  });
});

window.addEventListener('scroll', ()=>{
  const y = window.scrollY + 90;
  let current = sections[0];
  for (const s of sections) {
    if (s.offsetTop <= y) current = s;
  }
  navLinks.forEach(a=>{
    a.classList.toggle('active', a.getAttribute('href') === '#' + current.id);
  });
});

// Gallery modal and filters
function setupGallery(){
  document.querySelectorAll('.gallery-grid .thumb').forEach(img=>{
    img.addEventListener('click', ()=>{
      document.getElementById('modal-img').src = img.src;
      document.getElementById('modal').style.display = 'flex';
    });
  });
  document.getElementById('modal-close').addEventListener('click', ()=>{document.getElementById('modal').style.display='none'});
  document.querySelectorAll('.gallery-filters .filter').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('.gallery-filters .filter').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-cat');
      document.querySelectorAll('.gallery-grid .thumb').forEach(img=>{
        if(cat==='all') img.style.display='block';
        else {
          const cats = img.getAttribute('data-cat')||'';
          img.style.display = cats.includes(cat) ? 'block' : 'none';
        }
      });
    });
  });
}

// Reviews
async function loadReviews(){
  try{
    const res = await fetch('/api/reviews');
    const data = await res.json();
    const list = document.getElementById('reviews-list');
    list.innerHTML = data.map(r=>`<div class="review-item"><strong>${r.name}</strong> — ${r.rating}/5<p>${r.text||''}</p><small>${r.date}</small></div>`).join('');
  }catch(e){console.warn('Could not load reviews',e)}
}
document.getElementById('review-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = { name: fd.get('name'), rating: fd.get('rating'), text: fd.get('text') };
  await fetch('/api/reviews',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  e.target.reset();
  await loadReviews();
});

// Contact
document.getElementById('contact-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(e.target);
  const payload = { name: fd.get('name'), email: fd.get('email'), message: fd.get('message') };
  await fetch('/api/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  e.target.reset();
  alert(lang==='hi' ? 'धन्यवाद — संदेश भेजा गया' : 'Thanks — message sent');
});

// Newsletter (if present)
const newsletterForm = document.getElementById('newsletter-form');
if(newsletterForm){
  newsletterForm.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { email: fd.get('email') };
    await fetch('/api/newsletter',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    e.target.reset();
    alert(lang==='hi' ? 'सब्सक्राइब हो गया' : 'Subscribed');
  });
}

// Blog
async function fetchBlog(){
  try{
    const res = await fetch('/api/blog?lang=' + (lang === 'hi' ? 'hindi' : 'english'));
    const posts = await res.json();
    const el = document.getElementById('posts');
    el.innerHTML = posts.map(p=>`<article class="post"><h4>${p.title}</h4><p>${p.excerpt}</p><a href="#">${lang==='hi'?'और पढ़ें':'Read more'}</a></article>`).join('');
  }catch(e){console.warn('Could not load blog',e)}
}

// Init
applyTranslations();
loadReviews();
fetchBlog();
setupGallery();

// Load gallery from local API
async function loadGallery(cat = 'all') {
  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = '<div class="loading-section"><div class="spinner"></div><p style="color:var(--text-muted);font-size:0.9rem;">Loading gallery...</p></div>';
  try {
    const url = cat === 'all' ? '/api/images' : `/api/images?folder=${cat}`;
    const res = await fetch(url);
    const data = await res.json();
    const imgs = (data.images || []).filter(img => img.folder !== 'hero' && img.folder !== 'blog');
    if (!imgs.length) {
      grid.innerHTML = '<div class="gallery-empty"><p>No images in this category yet.</p></div>';
      return;
    }
    grid.innerHTML = imgs.map(img => `
      <div class="gallery-item" data-cat="${img.folder}" onclick="openModal('${img.path}')">
        <img src="${img.path}" alt="${img.name}" loading="lazy" onerror="this.parentElement.style.display='none'" />
      </div>`).join('');
  } catch(e) {
    grid.innerHTML = '<div class="gallery-empty"><p>Could not load images.</p></div>';
  }
}

window.filterGallery = function(cat, btn) {
  document.querySelectorAll('.gallery-filters .filter').forEach(x => x.classList.remove('active'));
  if(btn) btn.classList.add('active');
  loadGallery(cat);
};

function openModal(src) {
  const modal = document.getElementById('modal');
  const img = document.getElementById('modal-img');
  if(modal && img) { img.src = src; modal.style.display = 'flex'; }
}

// Init gallery on page load
loadGallery('all');
