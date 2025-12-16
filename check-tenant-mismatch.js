// Check user's staff document and all jobs with their tenantIds
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkTenants() {
  try {
    console.log('\n=== STAFF DOCUMENTS ===\n');
    const staffSnapshot = await db.collection('staff').get();
    staffSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Staff: ${data.name}`);
      console.log(`  Email: ${data.email}`);
      console.log(`  TenantId: ${data.tenantId || 'MISSING!'}`);
      console.log(`  UID: ${doc.id}\n`);
    });

    console.log('\n=== ALL JOBS WITH TENANT IDs ===\n');
    const jobsSnapshot = await db.collection('job_packs').get();
    jobsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Job: ${data.jobNumber} - ${data.location}`);
      console.log(`  TenantId: ${data.tenantId || 'MISSING!'}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Client: ${data.clientName}\n`);
    });

    console.log('\n=== TENANTS ===\n');
    const tenantsSnapshot = await db.collection('tenants').get();
    tenantsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Tenant: ${doc.id}`);
      console.log(`  Name: ${data.name || data.companyName}`);
      console.log(`  Status: ${data.status}\n`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
  process.exit(0);
}

checkTenants();
