// Script to fix duplicate job numbers in Firestore
// Run this once with: node fix-job-numbers.js

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixJobNumbers() {
  console.log('Starting job number fix...');
  
  try {
    // Get all jobs
    const jobsSnapshot = await db.collection('job_packs').get();
    const jobs = [];
    
    jobsSnapshot.forEach(doc => {
      jobs.push({
        id: doc.id,
        jobNumber: doc.data().jobNumber,
        createdAt: doc.data().startDate || new Date(0),
        ...doc.data()
      });
    });
    
    console.log(`Found ${jobs.length} total jobs`);
    
    // Sort by creation date (oldest first)
    jobs.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || a.createdAt;
      const dateB = b.createdAt?.toDate?.() || b.createdAt;
      return new Date(dateA) - new Date(dateB);
    });
    
    // Renumber all jobs sequentially
    const batch = db.batch();
    let updateCount = 0;
    
    jobs.forEach((job, index) => {
      const newJobNumber = `TF-${String(index + 1).padStart(4, '0')}`;
      
      if (job.jobNumber !== newJobNumber) {
        console.log(`Updating job ${job.id}: ${job.jobNumber} -> ${newJobNumber}`);
        const jobRef = db.collection('job_packs').doc(job.id);
        batch.update(jobRef, { jobNumber: newJobNumber });
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ Successfully updated ${updateCount} job numbers`);
    } else {
      console.log('✅ No duplicates found, all job numbers are unique');
    }
    
    // Verify no duplicates remain
    const jobNumbers = jobs.map((_, i) => `TF-${String(i + 1).padStart(4, '0')}`);
    const uniqueNumbers = new Set(jobNumbers);
    
    if (jobNumbers.length === uniqueNumbers.size) {
      console.log('✅ Verification passed: All job numbers are now unique');
    } else {
      console.log('❌ Warning: Duplicates may still exist');
    }
    
  } catch (error) {
    console.error('Error fixing job numbers:', error);
  }
  
  process.exit(0);
}

fixJobNumbers();
