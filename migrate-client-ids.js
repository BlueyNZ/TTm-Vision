// Migration script to update clientId from 'dev-client' to actual user UID
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function migrateClientIds() {
  const YOUR_UID = 'jBYKnDFEAgW1RGndLbjPv0RDs5I2'; // Your actual user ID
  
  console.log('Starting migration...');
  console.log(`Looking for jobs with clientId: 'dev-client'`);
  console.log(`Will update to: ${YOUR_UID}\n`);

  try {
    // Get ALL jobs and update any that don't have your UID
    const snapshot = await db.collection('job_packs').get();

    if (snapshot.empty) {
      console.log('No jobs found in database');
      return;
    }

    console.log(`Total jobs in database: ${snapshot.size}\n`);
    
    // Show current state
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- Job ${data.jobNumber || 'no number'}: clientId = "${data.clientId}" (ID: ${doc.id})`);
    });
    
    // Filter to jobs that need updating
    const jobsToUpdate = [];
    snapshot.forEach(doc => {
      if (doc.data().clientId !== YOUR_UID) {
        jobsToUpdate.push(doc);
      }
    });
    
    if (jobsToUpdate.length === 0) {
      console.log('\n✅ All jobs already have the correct clientId!');
      return;
    }

    console.log(`\n📝 Found ${jobsToUpdate.length} job(s) to update:\n`);

    const batch = db.batch();
    let count = 0;

    jobsToUpdate.forEach(doc => {
      const data = doc.data();
      console.log(`- Updating Job ${data.jobNumber || doc.id}: clientId "${data.clientId}" → "${YOUR_UID}"`);
      
      batch.update(doc.ref, { clientId: YOUR_UID });
      count++;
    });

    await batch.commit();
    
    console.log(`\n✅ Successfully updated ${count} job(s)!`);
    console.log('Jobs now have clientId:', YOUR_UID);
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
  } finally {
    process.exit();
  }
}

migrateClientIds();
