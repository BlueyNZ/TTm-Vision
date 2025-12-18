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

    // Verify the user is an admin
    const requestingUserDoc = await firestore.collection('staff').where('email', '==', decodedToken.email).get();
    if (requestingUserDoc.empty) {
      return NextResponse.json(
        { error: 'Forbidden - User not found in staff collection' },
        { status: 403 }
      );
    }

    const requestingUser = requestingUserDoc.docs[0].data();
    if (requestingUser.accessLevel !== 'Admin' && requestingUser.accessLevel !== 'Management' && requestingUser.role !== 'Owner') {
      return NextResponse.json(
        { error: 'Forbidden - Admin, Management, or Owner access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
      );
    }

    // Set custom claims for the client user
    await auth.setCustomUserClaims(userId, {
      role: 'client',
      accessLevel: 'client',
    });

    return NextResponse.json({
      success: true,
      message: 'Client role assigned successfully',
    });

  } catch (error: any) {
    console.error('Error setting client role:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
