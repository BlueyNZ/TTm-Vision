/**
 * Clear All Collections Script
 * 
 * WARNING: This will DELETE ALL DATA from your Firestore database!
 * Only use this in development/testing environments.
 * 
 * Usage: node clear-all-data.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Collections to clear
const COLLECTIONS = [
  'staff',
  'clients',
  'trucks',
  'timesheets',
  'truck_inspections',
  'hazard_ids',
  'hazard_ids_nzgttm',
  'tmp_checking_processes',
  'on_site_records',
  'on_site_records_mobile_ops',
  'job_notes',
  'site_photos',
  'incident_reports',
  'site_audits',
  'job_packs',
  'notifications',
  'client_registrations'
];

async function deleteCollection(collectionName) {
  console.log(`\n🗑️  Deleting collection: ${collectionName}`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`   ℹ️  Collection is already empty`);
      return 0;
    }

    const batch = db.batch();
    let count = 0;

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
      count++;
    });

    await batch.commit();
    console.log(`   ✅ Deleted ${count} documents`);
    return count;
    
  } catch (error) {
    console.error(`   ❌ Error deleting ${collectionName}:`, error.message);
    return 0;
  }
}

async function deleteAllSubcollections() {
  console.log('\n📦 Deleting job sub-collections...');
  
  try {
    const jobsSnapshot = await db.collection('job_packs').get();
    
    if (jobsSnapshot.empty) {
      console.log('   ℹ️  No jobs found');
      return;
    }

    const subcollections = [
      'timesheets',
      'truck_inspections',
      'hazard_ids',
      'hazard_ids_nzgttm',
      'tmp_checking_processes',
      'on_site_records',
      'on_site_records_mobile_ops',
      'job_notes',
      'site_photos',
      'incident_reports',
      'site_audits',
      'chat_messages'
    ];

    let totalDeleted = 0;

    for (const job of jobsSnapshot.docs) {
      for (const subcollection of subcollections) {
        const subSnapshot = await db.collection('job_packs').doc(job.id).collection(subcollection).get();
        
        if (!subSnapshot.empty) {
          const batch = db.batch();
          subSnapshot.docs.forEach(doc => batch.delete(doc.ref));
          await batch.commit();
          totalDeleted += subSnapshot.size;
        }
      }
    }

    console.log(`   ✅ Deleted ${totalDeleted} documents from job sub-collections`);
    
  } catch (error) {
    console.error('   ❌ Error deleting sub-collections:', error.message);
  }
}

async function clearAllData() {
  console.log('⚠️  WARNING: YOU ARE ABOUT TO DELETE ALL DATA!');
  console.log('📋 Collections to clear: ' + COLLECTIONS.length);
  console.log('\nStarting in 3 seconds... Press Ctrl+C to cancel');
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\n🚀 Starting data deletion...\n');
  const startTime = Date.now();
  
  // Delete job sub-collections first
  await deleteAllSubcollections();
  
  // Delete main collections
  let totalDeleted = 0;
  for (const collection of COLLECTIONS) {
    const deleted = await deleteCollection(collection);
    totalDeleted += deleted;
  }
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 DELETION SUMMARY');
  console.log('='.repeat(60));
  console.log(`🗑️  Total documents deleted: ${totalDeleted}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('='.repeat(60));
  console.log('\n✅ All data has been cleared!');
  console.log('💡 You can now create fresh data with proper tenantId fields.\n');
  
  process.exit(0);
}

// Run deletion
clearAllData().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
