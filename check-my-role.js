const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkUserRole(email) {
  try {
    console.log(`Checking role for: ${email}\n`);
    
    const staffSnapshot = await db.collection('staff')
      .where('email', '==', email)
      .get();
    
    if (staffSnapshot.empty) {
      console.log('❌ No staff record found for this email');
      return;
    }
    
    staffSnapshot.forEach(doc => {
      const data = doc.data();
      console.log('📋 Staff Record Found:');
      console.log(`   ID: ${doc.id}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Role: ${data.role}`);
      console.log(`   Access Level: ${data.accessLevel}`);
      console.log(`   Tenant ID: ${data.tenantId}`);
      console.log('');
      
      if (data.role === 'Owner') {
        console.log('✅ You have Owner role - button should show');
      } else {
        console.log(`⚠️ Your role is "${data.role}" not "Owner" - that's why the button doesn't show`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    admin.app().delete();
  }
}

const email = process.argv[2];
if (!email) {
  console.log('Usage: node check-my-role.js your-email@example.com');
  process.exit(1);
}

checkUserRole(email);
