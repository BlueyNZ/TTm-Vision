// Check all job numbers in database
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkJobs() {
  try {
    const jobsSnapshot = await db.collection('job_packs').get();
    
    console.log('\n=== ALL JOBS IN DATABASE ===\n');
    
    const jobNumbers = {};
    
    jobsSnapshot.forEach(doc => {
      const data = doc.data();
      const jobNumber = data.jobNumber || 'NO NUMBER';
      
      if (!jobNumbers[jobNumber]) {
        jobNumbers[jobNumber] = [];
      }
      jobNumbers[jobNumber].push({
        id: doc.id,
        location: data.location,
        clientName: data.clientName
      });
      
      console.log(`Job Number: ${jobNumber}`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Location: ${data.location}`);
      console.log(`  Client: ${data.clientName}`);
      console.log('');
    });
    
    console.log('\n=== DUPLICATE CHECK ===\n');
    
    let hasDuplicates = false;
    Object.keys(jobNumbers).forEach(num => {
      if (jobNumbers[num].length > 1) {
        console.log(`❌ DUPLICATE: ${num} appears ${jobNumbers[num].length} times`);
        jobNumbers[num].forEach(job => {
          console.log(`   - ${job.location} (ID: ${job.id})`);
        });
        hasDuplicates = true;
      }
    });
    
    if (!hasDuplicates) {
      console.log('✅ No duplicates found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

checkJobs();
