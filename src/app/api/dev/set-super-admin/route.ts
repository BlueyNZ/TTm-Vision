import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

// Dynamic import to avoid ESM/CJS issues
let admin: any;
let auth: any;

async function initializeFirebaseAdmin() {
  if (!admin) {
    admin = await import('firebase-admin');
    
    if (admin.apps?.length > 0) {
      auth = admin.auth();
      return;
    }
    
    const serviceAccountPath = join(process.cwd(), 'service-account-key.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    auth = admin.auth();
  }
}

interface SetSuperAdminRequest {
  email: string;
  superAdmin: boolean;
}

export async function POST(request: NextRequest) {
  await initializeFirebaseAdmin();
  
  try {
    const body: SetSuperAdminRequest = await request.json();
    const { email, superAdmin } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Get user by email
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch (error: any) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get current claims
    const currentUser = await auth.getUser(userRecord.uid);
    const currentClaims = currentUser.customClaims || {};

    // Set super admin claim
    await auth.setCustomUserClaims(userRecord.uid, {
      ...currentClaims,
      superAdmin: superAdmin,
    });

    return NextResponse.json({ 
      success: true,
      message: `Super admin ${superAdmin ? 'granted' : 'revoked'} for ${email}` 
    });

  } catch (error: any) {
    console.error('Error setting super admin:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
