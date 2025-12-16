// Update all job numbers from TF to TMV
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function updateJobNumbers() {
  try {
    console.log('Updating job numbers from TF to TMV...\n');
    
    const jobsSnapshot = await db.collection('job_packs').get();
    const batch = db.batch();
    let updateCount = 0;
    
    jobsSnapshot.forEach(doc => {
      const data = doc.data();
      const currentJobNumber = data.jobNumber;
      
      // Only update if it starts with TF-
      if (currentJobNumber && currentJobNumber.startsWith('TF-')) {
        const newJobNumber = currentJobNumber.replace('TF-', 'TMV-');
        batch.update(doc.ref, { jobNumber: newJobNumber });
        console.log(`Updating: ${currentJobNumber} → ${newJobNumber}`);
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`\n✅ Successfully updated ${updateCount} job numbers`);
    } else {
      console.log('ℹ️  No jobs found with TF- prefix');
    }
    
    // Verify updates
    console.log('\n=== VERIFICATION ===');
    const verifySnapshot = await db.collection('job_packs').get();
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Job: ${data.jobNumber} - ${data.location}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  process.exit(0);
}

updateJobNumbers();
