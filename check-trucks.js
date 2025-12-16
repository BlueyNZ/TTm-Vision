const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkTrucks() {
  console.log('🔍 Checking trucks collection...\n');

  const trucksSnapshot = await db.collection('trucks').get();
  
  if (trucksSnapshot.empty) {
    console.log('❌ No trucks found in database');
    return;
  }

  console.log(`Found ${trucksSnapshot.size} truck(s):\n`);

  trucksSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`Truck ID: ${doc.id}`);
    console.log(`  Name: ${data.name || 'N/A'}`);
    console.log(`  Plate: ${data.plate || 'N/A'}`);
    console.log(`  TenantId: ${data.tenantId || '❌ MISSING'}`);
    console.log(`  Status: ${data.status || 'N/A'}`);
    console.log('');
  });

  // Check staff for reference
  console.log('\n📋 Staff tenantId for reference:');
  const staffSnapshot = await db.collection('staff').limit(5).get();
  staffSnapshot.forEach(doc => {
    const data = doc.data();
    console.log(`  ${data.email}: tenantId = ${data.tenantId || 'MISSING'}`);
  });
}

checkTrucks()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
