// Check ALL jobs including those without job numbers
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkAllJobs() {
  try {
    const jobsSnapshot = await db.collection('job_packs').get();
    
    console.log(`\n=== ALL JOBS (${jobsSnapshot.size} total) ===\n`);
    
    jobsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`ID: ${doc.id}`);
      console.log(`  Job Number: ${data.jobNumber || 'NO NUMBER'}`);
      console.log(`  Location: ${data.location || 'N/A'}`);
      console.log(`  Status: ${data.status || 'N/A'}`);
      console.log(`  TenantId: ${data.tenantId || 'MISSING'}`);
      console.log(`  Client: ${data.clientName || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkAllJobs();
