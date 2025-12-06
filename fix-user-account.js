const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();

async function fixUserStaffDocument(email, companyName) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${email} (${user.uid})`);
    
    // Generate tenantId from company name
    const tenantId = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    console.log(`Tenant ID: ${tenantId}`);
    
    // Check if tenant exists
    const tenantDoc = await firestore.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      console.log(`❌ Tenant "${tenantId}" not found in database`);
      console.log('Creating tenant document...');
      
      await firestore.collection('tenants').doc(tenantId).set({
        id: tenantId,
        name: companyName,
        status: 'Active',
        createdAt: admin.firestore.Timestamp.now(),
        settings: {
          contactEmail: email,
        }
      });
      console.log('✅ Tenant document created');
    } else {
      console.log('✅ Tenant document exists');
    }
    
    // Create/update staff document
    const staffRef = firestore.collection('staff').doc(user.uid);
    await staffRef.set({
      tenantId: tenantId,
      name: user.displayName || 'Manager',
      email: email,
      phone: '',
      role: 'Owner',
      certifications: [],
      licenses: [],
      emergencyContact: {
        name: '',
        phone: '',
      },
      accessLevel: 5, // Admin level
      createdAt: admin.firestore.Timestamp.now(),
    }, { merge: true });
    
    console.log('✅ Staff document created/updated');
    
    // Get current custom claims
    const currentUser = await admin.auth().getUser(user.uid);
    const currentClaims = currentUser.customClaims || {};
    
    // Set custom claims with tenantId
    await admin.auth().setCustomUserClaims(user.uid, {
      ...currentClaims,
      tenantId: tenantId,
      staffId: user.uid,
      role: 'Owner',
      accessLevel: 5,
    });
    
    console.log('✅ Custom claims updated');
    console.log('\n🎉 All done! User must sign out and sign back in for claims to take effect.');
    console.log('\nCurrent claims:', {
      ...currentClaims,
      tenantId: tenantId,
      staffId: user.uid,
      role: 'Owner',
      accessLevel: 5,
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get arguments
const email = process.argv[2];
const companyName = process.argv[3];

if (!email || !companyName) {
  console.error('Usage: node fix-user-account.js <email> <company-name>');
  console.error('Example: node fix-user-account.js user@example.com "Traffic Flow Kapiti LTD"');
  process.exit(1);
}

fixUserStaffDocument(email, companyName);
