const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixTruckTenants() {
  console.log('🔧 Fixing truck tenantIds...\n');

  const trucksSnapshot = await db.collection('trucks').get();
  
  if (trucksSnapshot.empty) {
    console.log('No trucks found');
    return;
  }

  const batch = db.batch();
  let updateCount = 0;

  trucksSnapshot.forEach(doc => {
    const data = doc.data();
    if (!data.tenantId) {
      batch.update(doc.ref, { tenantId: 'test-ttm-company' });
      console.log(`✅ Updating truck: ${data.name} (${doc.id})`);
      updateCount++;
    } else {
      console.log(`✓ Truck already has tenantId: ${data.name} (${data.tenantId})`);
    }
  });

  if (updateCount > 0) {
    await batch.commit();
    console.log(`\n✅ Successfully updated ${updateCount} truck(s) to tenantId: test-ttm-company`);
  } else {
    console.log('\n✓ All trucks already have tenantId assigned');
  }
}

fixTruckTenants()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
