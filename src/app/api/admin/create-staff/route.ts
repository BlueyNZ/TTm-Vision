import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

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
    
    const serviceAccountPath = join(process.cwd(), 'service-account-key.json');
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    auth = admin.auth();
    firestore = admin.firestore();
  }
}

interface CreateStaffRequest {
  name: string;
  email: string;
  role: string;
  accessLevel: string;
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

    // Get the requesting user's tenantId
    const tenantId = requestingUser.tenantId;
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Forbidden - Admin user has no tenant association' },
        { status: 403 }
      );
    }

    // Parse request body
    const body: CreateStaffRequest = await request.json();
    const { name, email, role, accessLevel } = body;

    // Validate required fields
    if (!name || !email || !role || !accessLevel) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Generate a secure random password
    const tempPassword = generateSecurePassword();

    // Create Firebase Auth user
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password: tempPassword,
        displayName: name,
        emailVerified: false, // User will verify when they reset password
      });
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
      throw error;
    }

    // Set custom claims based on access level and include tenantId
    await auth.setCustomUserClaims(userRecord.uid, {
      role,
      accessLevel,
      tenantId,
      staffId: userRecord.uid,
    });

    // Create Firestore document in appropriate collection
    const collection = accessLevel === 'Client' ? 'clients' : 'staff';
    
    const docData: any = {
      name,
      email,
      role,
      accessLevel,
      userId: userRecord.uid,
      tenantId, // Add tenantId to the document
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: decodedToken.email,
    };

    // Add collection-specific fields
    if (collection === 'staff') {
      docData.certifications = [];
      docData.licenses = [];
      docData.emergencyContact = {
        name: '',
        phone: '',
      };
    } else {
      docData.status = 'Active';
      docData.phone = '';
    }

    await firestore.collection(collection).doc(userRecord.uid).set(docData);

    // Send password reset email using Firebase's built-in email service
    // This triggers Firebase's email template automatically
    try {
      const actionUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      await auth.generatePasswordResetLink(email, {
        url: `${actionUrl}/reset-password`,
      });
      
      // Firebase Admin SDK only generates the link, it doesn't send the email
      // To trigger Firebase's built-in email, we need to use sendPasswordResetEmail from the client SDK
      // We'll return success and let the UI handle triggering the email via client SDK
      
    } catch (error) {
      console.error('Error generating password reset link:', error);
    }

    // Return success - the client will trigger Firebase's email
    return NextResponse.json({
      success: true,
      userId: userRecord.uid,
      email,
      message: 'User created successfully. Password reset email will be sent.',
    });

  } catch (error: any) {
    console.error('Error creating staff:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Generate a secure random password (not used by user, just for account creation)
function generateSecurePassword(): string {
  const length = 20;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  const crypto = require('crypto');
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}
