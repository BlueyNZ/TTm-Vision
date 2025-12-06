const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const firestore = admin.firestore();

async function listAllTenants() {
  try {
    console.log('📋 Fetching all tenants from database...\n');
    
    const tenantsSnapshot = await firestore.collection('tenants').get();
    
    if (tenantsSnapshot.empty) {
      console.log('No tenants found in database.');
      process.exit(0);
    }
    
    console.log(`Found ${tenantsSnapshot.size} tenant(s):\n`);
    
    const tenants = [];
    tenantsSnapshot.forEach((doc) => {
      const data = doc.data();
      tenants.push({
        id: doc.id,
        ...data
      });
      
      console.log('─────────────────────────────────────');
      console.log(`Tenant ID: ${doc.id}`);
      console.log(`Company Name: ${data.name || data.companyName || 'N/A'}`);
      console.log(`Status: ${data.status || 'N/A'}`);
      console.log(`Contact Email: ${data.settings?.contactEmail || 'N/A'}`);
      console.log(`Created: ${data.createdAt ? data.createdAt.toDate().toLocaleString() : 'N/A'}`);
      console.log('─────────────────────────────────────\n');
    });
    
    // Show duplicates
    const nameMap = new Map();
    tenants.forEach(tenant => {
      const name = (tenant.name || tenant.companyName || '').toLowerCase();
      if (!nameMap.has(name)) {
        nameMap.set(name, []);
      }
      nameMap.get(name).push(tenant);
    });
    
    const duplicates = Array.from(nameMap.entries()).filter(([_, tenants]) => tenants.length > 1);
    
    if (duplicates.length > 0) {
      console.log('\n⚠️  POTENTIAL DUPLICATES FOUND:\n');
      duplicates.forEach(([name, dupes]) => {
        console.log(`"${name}" appears ${dupes.length} times:`);
        dupes.forEach(d => {
          console.log(`  - ID: ${d.id}`);
        });
        console.log('');
      });
      
      console.log('To delete a tenant, run:');
      console.log('node check-tenants.js delete <tenant-id>');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function deleteTenant(tenantId) {
  try {
    console.log(`🗑️  Deleting tenant: ${tenantId}...`);
    
    // Check if tenant exists
    const tenantDoc = await firestore.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      console.log('❌ Tenant not found');
      process.exit(1);
    }
    
    console.log(`Found tenant: ${tenantDoc.data().name || tenantDoc.data().companyName}`);
    console.log('⚠️  This will permanently delete the tenant record.');
    console.log('Staff records and other data will NOT be deleted.\n');
    
    // Delete the tenant
    await firestore.collection('tenants').doc(tenantId).delete();
    
    console.log('✅ Tenant deleted successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Get command
const command = process.argv[2];
const tenantId = process.argv[3];

if (command === 'delete') {
  if (!tenantId) {
    console.error('Usage: node check-tenants.js delete <tenant-id>');
    process.exit(1);
  }
  deleteTenant(tenantId);
} else {
  listAllTenants();
}
