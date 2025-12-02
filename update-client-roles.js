// Script to update existing clients with custom claims
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const firestore = admin.firestore();

async function updateClientRoles() {
  try {
    console.log('Starting to update client roles...\n');

    // Get all clients from Firestore
    const clientsSnapshot = await firestore.collection('clients').get();
    
    if (clientsSnapshot.empty) {
      console.log('No clients found in Firestore.');
      return;
    }

    console.log(`Found ${clientsSnapshot.size} client(s) to update.\n`);

    let updated = 0;
    let failed = 0;

    for (const doc of clientsSnapshot.docs) {
      const client = doc.data();
      const userId = client.userId || doc.id;

      try {
        // Set custom claims for this user
        await auth.setCustomUserClaims(userId, {
          role: 'client',
          accessLevel: 'client',
        });

        console.log(`✓ Updated ${client.name || client.email} (${userId})`);
        console.log(`  - Role: client`);
        console.log(`  - Access Level: client\n`);
        
        updated++;
      } catch (error) {
        console.error(`✗ Failed to update ${client.name || client.email} (${userId})`);
        console.error(`  Error: ${error.message}\n`);
        failed++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Total clients: ${clientsSnapshot.size}`);
    console.log(`Successfully updated: ${updated}`);
    console.log(`Failed: ${failed}`);

  } catch (error) {
    console.error('Error updating client roles:', error);
    process.exit(1);
  }
}

// Run the update
updateClientRoles()
  .then(() => {
    console.log('\nDone! All existing clients have been updated with custom claims.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Update failed:', error);
    process.exit(1);
  });
