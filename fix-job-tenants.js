// Fix jobs to match the correct tenant
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixJobs() {
  try {
    const correctTenantId = 'test-ttm-company'; // Your actual tenant
    
    console.log(`Updating jobs to tenantId: ${correctTenantId}\n`);
    
    // Fix TF-0001
    await db.collection('job_packs').doc('3YzFEsGgiytI9n9UQlvM').update({
      tenantId: correctTenantId
    });
    console.log('✅ Updated TF-0001');
    
    // Fix TF-0002
    await db.collection('job_packs').doc('CwkLyZ0CfMntCJE4r2g4').update({
      tenantId: correctTenantId
    });
    console.log('✅ Updated TF-0002');
    
    console.log('\n✅ All jobs now belong to tenant: test-ttm-company');
    console.log('Refresh your jobs page - both jobs should now be visible!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

fixJobs();
