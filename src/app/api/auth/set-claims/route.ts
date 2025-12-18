import { NextRequest, NextResponse } from 'next/server';

// Dynamic import to avoid ESM/CJS issues
let admin: any;
let auth: any;
let firestore: any;

async function initializeFirebaseAdmin() {
  if (!admin) {
    admin = await import('firebase-admin');
    
    if (admin.apps?.length > 0) {
      auth = admin.auth();
      firestore = admin.firestore();
      return;
    }
    
    // Use environment variables for secure credential management
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    auth = admin.auth();
    firestore = admin.firestore();
  }
}

export async function POST(request: NextRequest) {
  await initializeFirebaseAdmin();
  
  try {
    // Get the authorization token from headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify the requesting user is authenticated
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get user's staff document to find their tenantId
    const staffDoc = await firestore.collection('staff').doc(decodedToken.uid).get();
    
    if (!staffDoc.exists) {
      return NextResponse.json(
        { error: 'Staff document not found' },
        { status: 404 }
      );
    }

    const staffData = staffDoc.data();
    const { tenantId, role, accessLevel } = staffData;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'No tenantId found in staff document' },
        { status: 400 }
      );
    }

    // Get existing custom claims to preserve superAdmin
    const userRecord = await auth.getUser(decodedToken.uid);
    const existingClaims = userRecord.customClaims || {};

    // Set custom claims with tenantId, preserving superAdmin if it exists
    await auth.setCustomUserClaims(decodedToken.uid, {
      ...existingClaims,
      role,
      accessLevel,
      tenantId,
      staffId: decodedToken.uid,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Custom claims set successfully' 
    });

  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
