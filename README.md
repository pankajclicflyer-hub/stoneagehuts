
# StoneAgeHuts

Simple fullstack bilingual demo for StoneAgeHuts (frontend + Node/Express API).

Run locally

```bash
npm install
npm run dev   # or npm start
```

Open http://localhost:3000

API endpoints

GET  /api/reviews
POST /api/reviews
POST /api/contact
POST /api/newsletter
GET  /api/blog?lang=english|hindi

Download images (optional) - run these from project root to populate `public/images/`:

```bash
curl -o public/images/hero-bg.jpg "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1600&q=80"
mkdir -p public/images/property public/images/rooms public/images/activities public/images/nature
curl -o public/images/property/main-building.jpg https://images.unsplash.com/photo-1505691723518-36a7c6c0f9a7?w=800
curl -o public/images/property/entrance.jpg https://images.unsplash.com/photo-1526772662000-3f88f10405ff?w=800
curl -o public/images/rooms/resort-cottage.jpg https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800
curl -o public/images/rooms/hostel-dorm.jpg https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800
curl -o public/images/rooms/bird-cabin.jpg https://images.unsplash.com/photo-1445307806294-bff7f67ff225?w=800
curl -o public/images/activities/bird-watching.jpg https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800
curl -o public/images/activities/trekking.jpg https://images.unsplash.com/photo-1551632811-561732d1e306?w=800
curl -o public/images/activities/campfire.jpg https://images.unsplash.com/photo-1496080174650-637e3f22fa03?w=800
curl -o public/images/nature/landscape.jpg https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800
curl -o public/images/nature/sunset.jpg https://images.unsplash.com/photo-1483721310020-03333e577cce?w=800
```

## SEO & Sitemap

A `sitemap.xml` file lives in `public/` and will be served at `/sitemap.xml` when deployed. Add that URL to **Google Search Console → Sitemaps** to help crawlers index your site.

Recent SEO updates include:

* Meta title/description targeting the keyword **stone age huts**.
* Canonical link, preconnect/preload hints, and improved Core Web Vitals.
* Alt text for every `<img>` and lazy loading for offscreen visuals.
* Clear heading hierarchy (one H1, section H2s) and schema.org JSON‑LD markup.
* Mobile‑friendly responsive layout and faster load times.
* Admin dashboard now supports analytics filtering by event type and date range, as well as CSV export for review.

For further improvements, optimize image assets and use a CDN or build pipeline.
