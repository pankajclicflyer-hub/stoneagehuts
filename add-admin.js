const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

async function addAdminUser(email, password) {
  try {
    // Create user
    const user = await admin.auth().createUser({
      email: email,
      password: password,
      emailVerified: true
    });
    console.log('✅ User created:', user.uid);
    
    // Set admin claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log('✅ Admin claim set for:', email);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Add your users here
addAdminUser('newadmin@stoneagehuts.com', 'SecurePassword123');
addAdminUser('manager@stoneagehuts.com', 'ManagerPass456');
