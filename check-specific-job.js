// Check specific job details
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkJob(jobId) {
  try {
    const jobDoc = await db.collection('job_packs').doc(jobId).get();
    
    if (!jobDoc.exists) {
      console.log('Job not found!');
      return;
    }
    
    const data = jobDoc.data();
    console.log('\n=== JOB DETAILS ===\n');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

// Get job ID from command line or use default
const jobId = process.argv[2] || 'CwkLyZ0CfMntCJE4r2g4';
checkJob(jobId);
