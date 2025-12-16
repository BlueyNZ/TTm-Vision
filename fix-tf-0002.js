// Fix TF-0002 by adding tenantId
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixJob() {
  try {
    const jobId = 'CwkLyZ0CfMntCJE4r2g4'; // TF-0002
    const tenantId = 'traffic-flow'; // Default tenant
    
    console.log(`Fixing job ${jobId}...`);
    
    await db.collection('job_packs').doc(jobId).update({
      tenantId: tenantId
    });
    
    console.log(`✅ Successfully added tenantId: ${tenantId} to job TF-0002`);
    
    // Verify
    const updated = await db.collection('job_packs').doc(jobId).get();
    console.log('\nUpdated job data:');
    console.log(JSON.stringify(updated.data(), null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

fixJob();
