/**
 * Migration Script: Add tenantId to all existing data
 * 
 * This script adds tenantId: "traffic-flow" to all documents in all collections
 * Run this ONCE to migrate existing data to multi-tenant architecture
 * 
 * Usage: node migrate-to-multi-tenant.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const TENANT_ID = 'traffic-flow';

// Collections to update
const COLLECTIONS = [
  'staff',
  'clients',
  'trucks',
  'jobs',
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
  'notifications'
];

async function migrateCollection(collectionName) {
  console.log(`\n📦 Migrating collection: ${collectionName}`);
  
  try {
    const snapshot = await db.collection(collectionName).get();
    
    if (snapshot.empty) {
      console.log(`   ℹ️  Collection is empty, skipping...`);
      return { collection: collectionName, updated: 0, skipped: 0, errors: 0 };
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;
    const batch = db.batch();
    let batchCount = 0;

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip if already has tenantId
      if (data.tenantId) {
        skipped++;
        continue;
      }

      // Add tenantId to document
      batch.update(doc.ref, { tenantId: TENANT_ID });
      updated++;
      batchCount++;

      // Commit batch every 500 documents (Firestore limit)
      if (batchCount >= 500) {
        await batch.commit();
        console.log(`   ✅ Committed batch of ${batchCount} documents`);
        batchCount = 0;
      }
    }

    // Commit remaining documents
    if (batchCount > 0) {
      await batch.commit();
      console.log(`   ✅ Committed final batch of ${batchCount} documents`);
    }

    console.log(`   ✅ Updated: ${updated} | Skipped: ${skipped} | Errors: ${errors}`);
    return { collection: collectionName, updated, skipped, errors };
    
  } catch (error) {
    console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
    return { collection: collectionName, updated: 0, skipped: 0, errors: 1 };
  }
}

async function createTenantDocument() {
  console.log('\n🏢 Creating tenant document...');
  
  try {
    const tenantRef = db.collection('tenants').doc(TENANT_ID);
    const tenantDoc = await tenantRef.get();
    
    if (tenantDoc.exists) {
      console.log('   ℹ️  Tenant document already exists');
      return;
    }

    await tenantRef.set({
      id: TENANT_ID,
      name: 'Traffic Flow',
      status: 'Active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      settings: {
        contactEmail: 'admin@trafficflow.co.nz',
        contactPhone: '',
        primaryColor: '#3b82f6'
      }
    });
    
    console.log('   ✅ Tenant document created');
  } catch (error) {
    console.error('   ❌ Error creating tenant document:', error.message);
  }
}

async function runMigration() {
  console.log('🚀 Starting Multi-Tenant Migration');
  console.log(`📋 Tenant ID: ${TENANT_ID}`);
  console.log(`📋 Collections to migrate: ${COLLECTIONS.length}`);
  
  const startTime = Date.now();
  
  // Create tenant document first
  await createTenantDocument();
  
  // Migrate all collections
  const results = [];
  for (const collection of COLLECTIONS) {
    const result = await migrateCollection(collection);
    results.push(result);
  }
  
  // Summary
  const totalUpdated = results.reduce((sum, r) => sum + r.updated, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 MIGRATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Total documents updated: ${totalUpdated}`);
  console.log(`⏭️  Total documents skipped: ${totalSkipped}`);
  console.log(`❌ Total errors: ${totalErrors}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('='.repeat(60));
  
  if (totalErrors > 0) {
    console.log('\n⚠️  Some collections had errors. Please review the logs above.');
  } else {
    console.log('\n🎉 Migration completed successfully!');
  }
  
  process.exit(totalErrors > 0 ? 1 : 0);
}

// Run migration
runMigration().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
