# Multi-Tenant Implementation Guide

## ✅ Completed Steps

### 1. Data Type Updates
All major data types in `src/lib/data.ts` have been updated with `tenantId: string` field:

- ✅ `Tenant` - New type for organizations
- ✅ `Client`
- ✅ `Staff`
- ✅ `Truck`
- ✅ `Job`
- ✅ `Timesheet`
- ✅ `TruckInspection`
- ✅ `HazardId`
- ✅ `HazardIdNzgttm`
- ✅ `TmpCheckingProcess`
- ✅ `OnSiteRecord`
- ✅ `OnSiteRecordMobileOps`
- ✅ `JobNote`
- ✅ `SitePhoto`
- ✅ `IncidentReport`
- ✅ `SiteAudit`

### 2. Context Provider Created
✅ Created `src/contexts/tenant-context.tsx` - Provides user's tenantId throughout the app

### 3. Layout Updated
✅ Updated `src/app/(app)/layout.tsx` to include `TenantProvider`

### 4. Migration Script Created
✅ Created `migrate-to-multi-tenant.js` - Adds `tenantId: "traffic-flow"` to all existing documents

### 5. Sample Files Updated
✅ Updated `src/app/(app)/staff/page.tsx` with tenantId filtering
✅ Updated `src/components/staff/add-staff-dialog.tsx` with tenantId in payload

## 📋 Remaining Tasks

### Phase 1: Update All Queries (High Priority)

#### Collection Queries - Add tenantId filter
All `useCollection` calls for these collections need `where('tenantId', '==', tenantId)`:

**Main Collections:**
- [ ] `src/app/(app)/clients/page.tsx` - clients collection
- [ ] `src/app/(app)/fleet/page.tsx` - trucks collection  
- [ ] `src/app/(app)/scheduler/page.tsx` - job_packs collection
- [ ] `src/app/(app)/paperwork/page.tsx` - job_packs collection
- [ ] `src/app/(app)/jobs/[id]/edit/page.tsx` - staff & clients collections
- [ ] `src/app/(app)/map/page.tsx` - job_packs collection
- [ ] `src/app/(app)/notifications/page.tsx` - multiple collections
- [ ] `src/app/(app)/requests/page.tsx` - job_packs collection
- [ ] `src/components/layout/sidebar.tsx` - job_packs, client_registrations
- [ ] `src/components/dashboard/certifications-expiry.tsx` - staff collection
- [ ] `src/components/dashboard/fleet-service-status.tsx` - trucks collection

**Paperwork Pages - Add tenantId filter:**
All paperwork-related pages that query `staff`, `job_packs`, `trucks`:
- [ ] `src/app/(app)/jobs/[id]/paperwork/*/create/page.tsx` (multiple files)
- [ ] `src/app/(app)/jobs/[id]/paperwork/*/page.tsx` (multiple files)

#### Update Example Pattern:

**Before:**
```typescript
const staffCollection = useMemoFirebase(() => {
  if (!firestore) return null;
  return collection(firestore, 'staff');
}, [firestore]);
```

**After:**
```typescript
import { useTenant } from '@/contexts/tenant-context';

const { tenantId } = useTenant();

const staffCollection = useMemoFirebase(() => {
  if (!firestore || !tenantId) return null;
  return query(
    collection(firestore, 'staff'), 
    where('tenantId', '==', tenantId)
  );
}, [firestore, tenantId]);
```

### Phase 2: Update All Document Creation (High Priority)

All `addDoc` and `setDoc` calls need to include `tenantId` in the payload:

**Component Dialogs:**
- [ ] `src/components/clients/add-client-dialog.tsx`
- [ ] `src/components/fleet/add-truck-dialog.tsx`
- [ ] `src/components/clients/add-client-staff-dialog.tsx`

**Job Creation/Editing:**
- [ ] `src/app/(client)/client/request-job/page.tsx`
- [ ] `src/app/(app)/requests/[id]/page.tsx`
- [ ] `src/app/(app)/jobs/[id]/edit/page.tsx`

**Paperwork Creation:**
- [ ] All paperwork form submissions in `src/app/(app)/jobs/[id]/paperwork/*/create/page.tsx`

**Update Example:**
```typescript
import { useTenant } from '@/contexts/tenant-context';

const { tenantId } = useTenant();

const payload = {
  tenantId,  // Add this
  name: data.name,
  // ... rest of fields
};

await addDoc(collection(firestore, 'collection_name'), payload);
```

### Phase 3: Update Server-Side Code

**API Routes:**
- [ ] `src/app/api/admin/create-staff/route.ts` - Add tenantId to new staff documents
- [ ] `src/app/api/admin/set-client-role/route.ts` - Ensure tenant-scoped queries

**Update Pattern:**
```typescript
await firestore.collection('staff').doc(uid).set({
  tenantId: 'traffic-flow', // Get from requesting user's token claims
  ...otherData
});
```

### Phase 4: Security Rules Update

Update `firestore.rules` to enforce tenant isolation:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to get user's tenantId from custom claims
    function getUserTenantId() {
      return request.auth.token.tenantId;
    }
    
    // Staff collection - tenant-scoped
    match /staff/{staffId} {
      allow read: if request.auth != null && 
                     resource.data.tenantId == getUserTenantId();
      allow write: if request.auth != null && 
                      request.resource.data.tenantId == getUserTenantId();
    }
    
    // Clients collection - tenant-scoped
    match /clients/{clientId} {
      allow read: if request.auth != null && 
                     resource.data.tenantId == getUserTenantId();
      allow write: if request.auth != null && 
                      request.resource.data.tenantId == getUserTenantId();
    }
    
    // Trucks collection - tenant-scoped
    match /trucks/{truckId} {
      allow read: if request.auth != null && 
                     resource.data.tenantId == getUserTenantId();
      allow write: if request.auth != null && 
                      request.resource.data.tenantId == getUserTenantId();
    }
    
    // Jobs collection - tenant-scoped
    match /job_packs/{jobId} {
      allow read: if request.auth != null && 
                     resource.data.tenantId == getUserTenantId();
      allow write: if request.auth != null && 
                      request.resource.data.tenantId == getUserTenantId();
      
      // Job sub-collections inherit tenant from parent
      match /{subCollection}/{docId} {
        allow read: if request.auth != null;
        allow write: if request.auth != null;
      }
    }
    
    // Tenants collection - read only
    match /tenants/{tenantId} {
      allow read: if request.auth != null && 
                     tenantId == getUserTenantId();
      allow write: if false; // Only admins via backend
    }
  }
}
```

### Phase 5: Add tenantId to User Claims

Update user creation to include tenantId in custom claims:

**In `src/app/api/admin/create-staff/route.ts`:**
```typescript
await auth.setCustomUserClaims(userRecord.uid, {
  role: 'staff',
  tenantId: 'traffic-flow', // Add this
  accessLevel: staffData.accessLevel
});
```

### Phase 6: Migration Execution

1. **Backup database** (Firestore export)
2. **Run migration:**
   ```powershell
   node migrate-to-multi-tenant.js
   ```
3. **Verify data:**
   - Check that all documents have `tenantId: "traffic-flow"`
   - Verify tenant document was created
4. **Update user claims** for all existing users to include `tenantId: "traffic-flow"`

### Phase 7: Testing

- [ ] Test all CRUD operations
- [ ] Verify data isolation between tenants
- [ ] Test security rules
- [ ] Verify queries return only tenant-scoped data
- [ ] Test user authentication and authorization
- [ ] Test all forms and dialogs

## 🎯 Implementation Priority

1. **CRITICAL** - Run migration script to add tenantId to existing data
2. **CRITICAL** - Update all queries to filter by tenantId
3. **CRITICAL** - Update all document creation to include tenantId
4. **HIGH** - Update security rules
5. **HIGH** - Add tenantId to user claims
6. **MEDIUM** - Create tenant management UI
7. **LOW** - Add tenant switching for super-admins

## 📊 Files Requiring Updates

### Query Updates (~40 files)
See "Phase 1" above for specific files

### Document Creation Updates (~25 files)
See "Phase 2" above for specific files

### Configuration Files
- `firestore.rules` - Security rules
- `src/app/api/admin/*/route.ts` - API routes

## ⚠️ Important Notes

1. **Backward Compatibility:** The migration script defaults to `'traffic-flow'` for any document missing tenantId
2. **Sub-collections:** Job paperwork sub-collections don't need tenantId if parent job has it
3. **Client Portal:** Client users access jobs via their client ID, which is tenant-scoped
4. **Testing:** Test thoroughly in development before deploying to production
5. **Rollback Plan:** Keep database backup before running migration

## 🚀 Quick Start

To continue implementation:

1. Run migration: `node migrate-to-multi-tenant.js`
2. Update queries in pages (start with staff, clients, trucks, jobs)
3. Update document creation in dialogs
4. Deploy security rules
5. Test thoroughly

## 📝 Example Files

### Already Updated (Reference):
- ✅ `src/app/(app)/staff/page.tsx`
- ✅ `src/components/staff/add-staff-dialog.tsx`

### Next to Update:
1. `src/app/(app)/clients/page.tsx`
2. `src/app/(app)/fleet/page.tsx`
3. `src/app/(app)/scheduler/page.tsx`
4. `src/components/clients/add-client-dialog.tsx`
5. `src/components/fleet/add-truck-dialog.tsx`
