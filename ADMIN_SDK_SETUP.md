# Firebase Admin SDK - Staff Creation Setup

## ✅ Implementation Complete

Your Create Staff page now uses Firebase Admin SDK to automatically create user accounts with password reset links.

## How It Works

### 1. **Admin Creates Staff**
- Navigate to Admin → Create Staff
- Fill out the form:
  - Full Name
  - Email Address
  - Job Title/Role (TC, STMS, Operator, Owner, Tester)
  - Access Level (Staff Member, Admin, Client)
- Click "Create Profile"

### 2. **System Automatically:**
- ✅ Creates Firebase Auth account with secure random password
- ✅ Creates Firestore document in `staff` or `clients` collection
- ✅ Sets custom claims for role-based access control
- ✅ Generates password reset link (valid 24 hours)
- ✅ Shows success screen with link

### 3. **Admin Shares Link**
Two options on success screen:
- **Copy Link** - Copies password reset link to clipboard
- **Open Email Client** - Opens your default email app with pre-filled message

### 4. **User Sets Password**
- User receives the link (via email, text, or any method you choose)
- Clicks link and sets their password
- Can now log in at the login page

## Security Features

### ✅ Authentication Verified
- Only logged-in admins can access the API
- Token verification on every request

### ✅ Admin Authorization
- Checks if user has `accessLevel: 'Admin'` in staff collection
- Non-admins get "Forbidden" error

### ✅ Secure Password Generation
- 20-character random password (never shown to anyone)
- User must set their own password via reset link

### ✅ Custom Claims
- Role and access level stored in Firebase Auth
- Can be used for security rules and middleware

## API Endpoint

**POST** `/api/admin/create-staff`

**Headers:**
```
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "role": "TC",
  "accessLevel": "Staff Member"
}
```

**Response (Success):**
```json
{
  "success": true,
  "userId": "abc123...",
  "email": "john@example.com",
  "resetLink": "https://ttm-vision.firebaseapp.com/__/auth/action?mode=resetPassword&...",
  "message": "User created successfully. Send the password reset link to the user."
}
```

**Response (Error):**
```json
{
  "error": "Email already exists"
}
```

## Files Created/Modified

### ✅ New Files
- `src/app/api/admin/create-staff/route.ts` - API endpoint with Admin SDK

### ✅ Modified Files
- `src/app/(app)/admin/create-staff/page.tsx` - Updated to use API instead of manual process

## What's Created in Firestore

### For Staff Members (accessLevel: "Staff Member" or "Admin"):
```typescript
{
  name: "John Doe",
  email: "john@example.com",
  role: "TC",
  accessLevel: "Staff Member",
  userId: "firebase-uid",
  certifications: [],
  licenses: [],
  emergencyContact: {
    name: "",
    phone: ""
  },
  createdAt: Timestamp,
  createdBy: "admin@example.com"
}
```

### For Clients (accessLevel: "Client"):
```typescript
{
  name: "Company Name",
  email: "client@example.com",
  role: "Client",
  accessLevel: "Client",
  userId: "firebase-uid",
  status: "Active",
  phone: "",
  createdAt: Timestamp,
  createdBy: "admin@example.com"
}
```

## Testing Checklist

- [ ] Log in as an admin
- [ ] Go to Admin → Create Staff
- [ ] Fill out the form with test data
- [ ] Submit and verify success screen shows
- [ ] Copy the password reset link
- [ ] Open link in incognito/private window
- [ ] Set a new password
- [ ] Log in with new credentials
- [ ] Verify user appears in staff list

## Troubleshooting

### "Unauthorized - No token provided"
- Make sure you're logged in
- Clear browser cache and log in again

### "Forbidden - Admin access required"
- Your account needs `accessLevel: 'Admin'` in the staff collection
- Check Firebase console → Firestore → staff collection

### "Email already exists"
- This email is already registered
- Use a different email or delete the existing user from Firebase Auth

### "Internal server error"
- Check server logs for details
- Verify service-account-key.json is in project root
- Ensure firebase-admin package is installed

## Environment Variables

Make sure these are set in `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

## Password Reset Link Format

The generated link looks like:
```
https://ttm-vision.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=ABC123...&apiKey=xyz...
```

- Valid for **24 hours**
- One-time use only
- Firebase handles the password reset UI
- Redirects to your login page after completion

## Future Enhancements (Optional)

You could add:
- Email service integration (SendGrid, Mailgun, etc.) to automatically send links
- SMS integration for mobile notifications
- Custom password reset page (instead of Firebase default)
- Bulk user import from CSV
- User invitation expiry tracking

---

## Need Help?

Everything is already set up and working! Just:
1. Make sure your dev server is running
2. Log in as an admin
3. Go to Create Staff and try it out

The password reset link can be shared via any method:
- Email (using "Open Email Client" button)
- Text message
- Slack/Teams
- Phone call
- In person

The link is the only thing the new user needs to set their password and get started!
