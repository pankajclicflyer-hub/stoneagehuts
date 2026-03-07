const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();
async function seed() {
  console.log('Seeding data...');
  const rooms = [
    { icon:'🏡', title:'Resort Cottages', description:'Private luxury cottages with mountain views, attached bathrooms, and a cozy fireplace.', features:['Mountain View','Attached Bath','Fireplace','Breakfast'], order:1, active:true },
    { icon:'🛏️', title:'Hostel Dormitories', description:'Budget-friendly shared rooms perfect for backpackers and solo travellers.', features:['Backpacker Friendly','Lockers','Common Room'], order:2, active:true },
    { icon:'🦜', title:'Bird Watching Cabins', description:'Special cabins next to the bird sanctuary with guided morning tours included.', features:['Near Sanctuary','Guided Tour','Sunrise View'], order:3, active:true }
  ];
  for(const r of rooms) await db.collection('rooms').add(r);
  console.log('Rooms done');
  const acts = [
    { icon:'🦜', title:'Bird Watching', description:'Guided birding tours. 200+ species!', featured:true, order:1, active:true },
    { icon:'🥾', title:'Trekking', description:'Guided treks through Kumaon trails.', featured:false, order:2, active:true },
    { icon:'🌿', title:'Nature Trails', description:'Leisurely walks through forests and meadows.', featured:false, order:3, active:true },
    { icon:'📸', title:'Photography Tours', description:'Capture landscapes and wildlife.', featured:false, order:4, active:true },
    { icon:'🔥', title:'Campfire Nights', description:'Evening bonfires under starlit skies.', featured:false, order:5, active:true }
  ];
  for(const a of acts) await db.collection('activities').add(a);
  console.log('Activities done');
  const posts = [
    { emoji:'🦜', title:'Top 10 Birds to Spot in Kumaon This Winter', category:'Bird Watching', excerpt:'Winter is prime time for birding in Kumaon. From Himalayan Monal to Siberian migrants.', published:true, date:admin.firestore.Timestamp.now() },
    { emoji:'🥾', title:'Beginners Guide to Trekking Near Nainital', category:'Trekking', excerpt:'New to trekking? 5 best beginner routes with tips on gear and timing.', published:true, date:admin.firestore.Timestamp.now() },
    { emoji:'🌿', title:'Why Slow Travel in the Hills is the Best', category:'Travel Tips', excerpt:'Stop rushing. A week in one mountain village will change how you travel forever.', published:true, date:admin.firestore.Timestamp.now() }
  ];
  for(const p of posts) await db.collection('posts').add(p);
  console.log('Posts done');
  await db.collection('contact_info').add({ phone:'+91 98765 43210', email:'info@stoneagehuts.com', address:'Near Nainital, Uttarakhand', checkin:'Check-in: 12:00 PM - Check-out: 11:00 AM', instagram:'#', facebook:'#', twitter:'#', tripadvisor:'#', youtube:'#' });
  console.log('Contact done');
  const reviews = [
    { name:'Priya Sharma', rating:5, text:'Absolutely magical place! Bird watching was incredible.', status:'approved', createdAt:admin.firestore.Timestamp.now() },
    { name:'Arjun Mehta', rating:5, text:'Perfect weekend escape from Delhi. Staff were incredibly warm.', status:'approved', createdAt:admin.firestore.Timestamp.now() },
    { name:'Sarah Johnson', rating:4, text:'Beautiful location, great food, amazing hospitality.', status:'approved', createdAt:admin.firestore.Timestamp.now() }
  ];
  for(const r of reviews) await db.collection('reviews').add(r);
  console.log('Reviews done');
  await db.collection('settings').add({ key:'hero_image', value:'' });
  console.log('Settings done');
  console.log('\nALL DONE! Admin panel refresh karo.');
  process.exit(0);
}
seed().catch(err => { console.error('Error:', err.message); process.exit(1); });
