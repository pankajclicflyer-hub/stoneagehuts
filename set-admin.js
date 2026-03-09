const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

// Initialize using service account credentials
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Your user UID
const userUid = 'RObdMwyjg3SGsCRXH060agUIw1D3';

admin.auth().setCustomUserClaims(userUid, { admin: true })
  .then(() => {
    console.log('✅ SUCCESS! You are now an admin!');
    console.log('User:', 'stoneagehuts@gmail.com');
    console.log('UID:', userUid);
    console.log('⚠️ Please log out and log back in');
  })
  .catch(error => {
    console.error('❌ Error:', error);
  });
