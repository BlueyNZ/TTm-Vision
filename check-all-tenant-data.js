const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function checkAllCollections() {
  console.log('🔍 Multi-Tenant Data Audit\n');
  console.log('='.repeat(60));

  // Check Jobs
  console.log('\n📋 JOBS (job_packs):');
  const jobsSnapshot = await db.collection('job_packs').get();
  console.log(`Total: ${jobsSnapshot.size} job(s)`);
  jobsSnapshot.forEach(doc => {
    const data = doc.data();
    const status = data.tenantId ? '✅' : '❌';
    console.log(`  ${status} ${data.jobNumber || doc.id} - tenantId: ${data.tenantId || 'MISSING'}`);
  });

  // Check Trucks
  console.log('\n🚛 TRUCKS:');
  const trucksSnapshot = await db.collection('trucks').get();
  console.log(`Total: ${trucksSnapshot.size} truck(s)`);
  trucksSnapshot.forEach(doc => {
    const data = doc.data();
    const status = data.tenantId ? '✅' : '❌';
    console.log(`  ${status} ${data.name} (${data.plate}) - tenantId: ${data.tenantId || 'MISSING'}`);
  });

  // Check Clients
  console.log('\n👥 CLIENTS:');
  const clientsSnapshot = await db.collection('clients').get();
  console.log(`Total: ${clientsSnapshot.size} client(s)`);
  clientsSnapshot.forEach(doc => {
    const data = doc.data();
    const status = data.tenantId ? '✅' : '❌';
    console.log(`  ${status} ${data.name} - tenantId: ${data.tenantId || 'MISSING'}`);
  });

  // Check Staff
  console.log('\n👤 STAFF:');
  const staffSnapshot = await db.collection('staff').get();
  console.log(`Total: ${staffSnapshot.size} staff member(s)`);
  const staffByTenant = {};
  staffSnapshot.forEach(doc => {
    const data = doc.data();
    const tenant = data.tenantId || 'MISSING';
    if (!staffByTenant[tenant]) {
      staffByTenant[tenant] = [];
    }
    staffByTenant[tenant].push(data.email || data.name);
  });
  
  Object.keys(staffByTenant).sort().forEach(tenant => {
    const status = tenant === 'MISSING' ? '❌' : '✅';
    console.log(`  ${status} Tenant: ${tenant}`);
    staffByTenant[tenant].forEach(email => {
      console.log(`      - ${email}`);
    });
  });

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY:');
  
  const jobsWithoutTenant = jobsSnapshot.docs.filter(d => !d.data().tenantId).length;
  const trucksWithoutTenant = trucksSnapshot.docs.filter(d => !d.data().tenantId).length;
  const clientsWithoutTenant = clientsSnapshot.docs.filter(d => !d.data().tenantId).length;
  const staffWithoutTenant = staffSnapshot.docs.filter(d => !d.data().tenantId).length;
  
  const allIssues = jobsWithoutTenant + trucksWithoutTenant + clientsWithoutTenant + staffWithoutTenant;
  
  if (allIssues === 0) {
    console.log('✅ All records have tenantId assigned!');
  } else {
    console.log(`❌ Found ${allIssues} record(s) missing tenantId:`);
    if (jobsWithoutTenant > 0) console.log(`   - ${jobsWithoutTenant} job(s)`);
    if (trucksWithoutTenant > 0) console.log(`   - ${trucksWithoutTenant} truck(s)`);
    if (clientsWithoutTenant > 0) console.log(`   - ${clientsWithoutTenant} client(s)`);
    if (staffWithoutTenant > 0) console.log(`   - ${staffWithoutTenant} staff member(s)`);
  }
  
  console.log('='.repeat(60));
}

checkAllCollections()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err);
    process.exit(1);
  });
