const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function setSuperAdmin(email, isSuperAdmin = true) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    // Get current custom claims
    const currentUser = await admin.auth().getUser(user.uid);
    const currentClaims = currentUser.customClaims || {};
    
    // Set super admin claim
    await admin.auth().setCustomUserClaims(user.uid, {
      ...currentClaims,
      superAdmin: isSuperAdmin,
    });
    
    console.log(`✅ Super admin ${isSuperAdmin ? 'granted' : 'revoked'} for: ${email}`);
    console.log(`User must sign out and sign back in for changes to take effect.`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting super admin:', error.message);
    process.exit(1);
  }
}

// Get email from command line arguments
const email = process.argv[2];
const grantAccess = process.argv[3] !== 'false'; // Default to true, pass 'false' to revoke

if (!email) {
  console.error('Usage: node set-super-admin.js <email> [true|false]');
  console.error('Example: node set-super-admin.js admin@example.com');
  console.error('Example: node set-super-admin.js admin@example.com false (to revoke)');
  process.exit(1);
}

setSuperAdmin(email, grantAccess);
