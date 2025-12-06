# Developer Admin Guide

This guide explains how to set up and use the super admin developer dashboard to manage companies using your platform.

## Overview

The developer admin system provides a secure way for you (as the platform developer) to manage all companies that sign up for your service. This is separate from the regular admin role that company staff members have.

### Features

- **View All Companies**: See all registered tenants/companies
- **Monitor Status**: Check if companies are Active, Suspended, or Inactive
- **Manage Companies**: Change company status or delete companies
- **Tenant Information**: View tenant IDs, contact emails, and creation dates
- **Real-time Updates**: Dashboard updates automatically as changes occur

## Setup Instructions

### Step 1: Set Yourself as Super Admin

Run the CLI script to grant yourself super admin privileges:

```bash
node set-super-admin.js your@email.com
```

**Example:**
```bash
node set-super-admin.js developer@example.com
```

The script will confirm when the super admin claim has been set.

### Step 2: Sign Out and Back In

For the custom claims to take effect, you must:
1. Sign out of your account
2. Sign back in with the same email

This refreshes your authentication token with the new `superAdmin` claim.

### Step 3: Access the Developer Dashboard

Once you're signed back in:
1. You'll see a new "Developer" menu item in the sidebar (with a Code2 icon)
2. Click it to navigate to `/dev`
3. The dashboard will load with all company information

## Using the Dashboard

### Viewing Companies

The dashboard displays a table with the following information:
- **Company Name**: The name of the tenant/company
- **Tenant ID**: The unique identifier for database isolation
- **Contact Email**: The email address of the company's primary contact
- **Status**: Current status (Active, Suspended, Inactive)
- **Created**: Date the company was registered
- **Actions**: Buttons to change status or delete

### Changing Company Status

1. Locate the company in the table
2. Click the status dropdown
3. Select a new status:
   - **Active**: Company can use the platform normally
   - **Suspended**: Company access is temporarily restricted
   - **Inactive**: Company is deactivated but data is preserved

The change takes effect immediately.

### Deleting a Company

⚠️ **Warning**: This permanently deletes the company's tenant record. Company data in other collections will remain but the tenant registration will be removed.

1. Click the "Delete" button next to the company
2. Confirm the deletion in the dialog
3. The company will be removed from the list

## Security

### Access Control

The developer dashboard is protected at multiple levels:

1. **Custom Claim Check**: Only users with `superAdmin: true` in their JWT can access `/dev`
2. **Component-Level**: The page checks claims before rendering
3. **Navigation**: The Developer menu item only shows for super admins
4. **API Protection**: The set-super-admin API can be further secured by checking the requester's claims

### Revoking Super Admin Access

To remove super admin privileges from an account:

```bash
node set-super-admin.js user@email.com false
```

The user will need to sign out and back in for the change to take effect.

## Multi-Tenant Architecture

The platform uses a comprehensive multi-tenant isolation system:

### Layer 1: Application Queries
All queries include `where('tenantId', '==', tenantId)` to filter data by company.

### Layer 2: Firestore Security Rules
Database rules enforce that:
- Users can only read/write data matching their `tenantId` claim
- Even if client code has bugs, the database rejects cross-tenant access

### Layer 3: Custom Claims
Every user's JWT contains:
- `tenantId`: Their company's unique identifier
- `staffId`: Their staff record ID
- `role`: Their role within the company
- `accessLevel`: Their permission level (1-5)
- `superAdmin` (optional): Developer admin flag

## Troubleshooting

### Developer Menu Not Showing

**Cause**: Super admin claim not set or not refreshed
**Solution**: 
1. Run `node set-super-admin.js your@email.com` again
2. Sign out completely
3. Clear browser cache (optional)
4. Sign back in

### Access Denied to /dev

**Cause**: Claims haven't taken effect yet
**Solution**: Force a token refresh by signing out and back in

### Companies Not Loading

**Cause**: Database permissions or query issue
**Solution**: 
1. Check browser console for errors
2. Verify Firebase initialization in `src/firebase/config.ts`
3. Ensure Firestore rules allow super admins to read tenant collection

## API Endpoints

### Set Super Admin (Programmatic)

**Endpoint**: `POST /api/dev/set-super-admin`

**Request Body**:
```json
{
  "email": "user@example.com",
  "superAdmin": true
}
```

**Response**:
```json
{
  "message": "Super admin status updated successfully"
}
```

### Set Custom Claims (Used on Login/Signup)

**Endpoint**: `POST /api/auth/set-claims`

**Request Body**:
```json
{
  "uid": "user-firebase-uid"
}
```

This automatically sets all custom claims based on the user's staff record.

## Best Practices

1. **Limit Super Admins**: Only grant super admin to trusted developers
2. **Monitor Changes**: Keep track of status changes and deletions
3. **Backup Data**: Before deleting companies, ensure you have backups if needed
4. **Test Isolation**: Regularly verify that companies cannot see each other's data
5. **Secure API**: Consider adding authentication to the set-super-admin API endpoint

## Next Steps

- Add audit logging for super admin actions
- Implement company analytics and usage statistics
- Add bulk operations (suspend multiple companies)
- Create company communication tools (email all companies)
- Add data export functionality for companies
