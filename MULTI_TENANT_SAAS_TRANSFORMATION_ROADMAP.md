# Multi-Tenant SaaS Transformation Roadmap
## Shine Job Pro → Multi-Tenant SaaS Platform

**Status**: Phase 1 - In Progress  
**Last Updated**: 2025-11-17  
**Current Architecture**: Partially Multi-Tenant  
**Target Architecture**: Full Multi-Tenant SaaS with Strict Isolation

---

## Executive Summary

This document outlines the complete transformation of Shine Job Pro from a partially multi-tenant booking management system into a fully-fledged multi-tenant SaaS platform with:
- **Strict tenant isolation** (no salon can access another salon's data)
- **Role-based access control** (Platform Owner, Salon Owner, Staff)
- **Tenant-aware routing** (`/app/{salonId}/...`)
- **Scalable architecture** ready for 1000+ tenants

---

## Current State Analysis

### ✅ What's Already Implemented
- **Database**: `salons` table exists with proper structure
- **Tenant Key**: `salon_id` column exists on most tables
- **RLS Policies**: Row Level Security enabled on tables
- **Roles System**: `user_roles` table with admin/staff/super_admin roles
- **Auth System**: JWT-based authentication via edge functions
- **Branch Context**: `BranchContext` for managing current salon

### ❌ Critical Issues
1. **Column Name Inconsistency**: Code uses `branch_id` but database has `salon_id`
2. **Flat Routing**: Uses `/dashboard` instead of `/app/{salonId}/dashboard`
3. **No Tenant Middleware**: No validation that user is accessing their own salon
4. **Auth Gaps**: salon_id not always enforced in JWT validation
5. **Mixed Queries**: Some queries don't filter by salon_id
6. **TypeScript Errors**: Type mismatches causing build failures

---

## Phase 1: Foundation & Stabilization (CURRENT)

### 1.1 Fix Column Naming Consistency ⏳
**Status**: In Progress  
**Blockers**: 50+ files reference `branch_id`

**Actions**:
```typescript
// Replace ALL instances of:
branch_id → salon_id
default_branch_id → default_salon_id
```

**Files to Update**:
- `/src/hooks/useLoyaltyConfig.ts` ✅
- `/src/hooks/useUserBranches.ts` ✅
- `/src/hooks/useStaffList.ts` ✅
- `/src/components/StaffBranchAssignment.tsx` ⏳
- `/src/components/BookingManagementDialog.tsx` ✅
- `/src/components/ManualBookingDialog.tsx` ✅
- `/src/pages/EnhancedBookingManagement.tsx` ⏳
- `/src/pages/StaffInvite.tsx` ⏳
- `/src/utils/timeSync.ts` ✅
- And 40+ more files...

### 1.2 Create Centralized Type Definitions
**File**: `/src/types/tenant.ts`

```typescript
export type UserRole = 'super_admin' | 'salon_owner' | 'staff';

export interface TenantContext {
  salonId: string;
  salonName: string;
  role: UserRole;
  permissions: string[];
}

export interface AuthMetadata {
  userId: string;
  email: string;
  role: UserRole;
  salonId: string | null;
  branchIds: string[]; // For users with access to multiple salons
}
```

### 1.3 Fix Build Errors
- Resolve TypeScript type mismatches
- Eliminate "Type instantiation excessively deep" errors
- Standardize Supabase query patterns

---

## Phase 2: Auth & JWT Enhancement

### 2.1 Update JWT Token Structure
**File**: `supabase/functions/_shared/auth-middleware.ts`

```typescript
// Current JWT structure
{
  userId: string;
  email: string;
  role: 'admin' | 'staff';
  branchIds: string[];
}

// Target JWT structure
{
  userId: string;
  email: string;
  role: 'super_admin' | 'salon_owner' | 'staff';
  salonId: string | null; // Primary salon
  branchIds: string[];    // All accessible salons
  permissions: string[];
}
```

### 2.2 Update Edge Functions
Files to modify:
- `supabase/functions/api-v1-auth-login/index.ts`
- `supabase/functions/api-v1-auth-session/index.ts`
- All other API v1 functions

**Add to login response**:
```typescript
return {
  token,
  refreshToken,
  user: {
    id: user.id,
    email: user.email,
    role: roleData.role,
    salonId: primarySalon?.id || null,
    branchIds: accessibleSalons.map(s => s.id),
  }
};
```

### 2.3 Update Client-Side Auth
**File**: `src/hooks/useApiAuth.ts`

Add `salonId` to auth state:
```typescript
interface AuthState {
  user: User | null;
  role: UserRole | null;
  salonId: string | null;  // NEW
  branchIds: string[];
  defaultBranch: string | null;
  loading: boolean;
  isAuthenticated: boolean;
}
```

---

## Phase 3: Tenant-Aware Routing

### 3.1 Update Route Structure
**Current**:
```
/dashboard
/booking-management
/staff-management
/admin
```

**Target**:
```
/app/{salonId}/dashboard
/app/{salonId}/bookings
/app/{salonId}/staff
/app/{salonId}/services
/app/{salonId}/calendar
/app/{salonId}/earnings
/app/{salonId}/profile

/platform/admin/tenants
/platform/admin/billing
/platform/admin/analytics
/platform/admin/audit-logs
```

### 3.2 Create Tenant Route Wrapper
**File**: `src/components/TenantRoute.tsx`

```typescript
import { useParams, Navigate } from 'react-router-dom';
import { useApiAuth } from '@/hooks/useApiAuth';

export const TenantRoute = ({ children }: { children: React.ReactNode }) => {
  const { salonId } = useParams();
  const { salonId: userSalonId, role, isAuthenticated } = useApiAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }

  // Super admins can access any salon
  if (role === 'super_admin') {
    return <>{children}</>;
  }

  // Validate user has access to this salon
  if (salonId !== userSalonId) {
    return <Navigate to={`/app/${userSalonId}/dashboard`} />;
  }

  return <>{children}</>;
};
```

### 3.3 Update App.tsx Routing
```typescript
<Routes>
  {/* Public Routes */}
  <Route path="/" element={<Login />} />
  <Route path="/auth" element={<AuthPage />} />

  {/* Tenant Routes */}
  <Route path="/app/:salonId/*" element={
    <TenantRoute>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="bookings" element={<BookingManagement />} />
        <Route path="staff" element={<StaffManagement />} />
        <Route path="calendar" element={<CalendarView />} />
        <Route path="earnings" element={<EarningsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Routes>
    </TenantRoute>
  } />

  {/* Platform Admin Routes */}
  <Route path="/platform/admin/*" element={
    <SuperAdminRoute>
      <Routes>
        <Route path="tenants" element={<TenantManagement />} />
        <Route path="billing" element={<BillingManagement />} />
        <Route path="analytics" element={<PlatformAnalytics />} />
      </Routes>
    </SuperAdminRoute>
  } />
</Routes>
```

---

## Phase 4: Tenant Isolation Middleware

### 4.1 Create Supabase Client Wrapper
**File**: `src/lib/supabase-tenant-client.ts`

```typescript
import { supabase } from '@/integrations/supabase/client';
import { useApiAuth } from '@/hooks/useApiAuth';

export const useTenantSupabase = () => {
  const { salonId, role } = useApiAuth();

  const tenantQuery = <T>(tableName: string) => {
    let query = supabase.from(tableName);

    // Super admins bypass salon filtering
    if (role !== 'super_admin' && salonId) {
      query = query.eq('salon_id', salonId);
    }

    return query as T;
  };

  return { tenantQuery };
};
```

### 4.2 Update All Queries
Replace:
```typescript
// ❌ OLD
const { data } = await supabase
  .from('bookings')
  .select('*');

// ✅ NEW
const { data } = await supabase
  .from('bookings')
  .select('*')
  .eq('salon_id', salonId);
```

---

## Phase 5: Database Schema Enhancements

### 5.1 Add Missing salon_id Columns
```sql
-- Verify all tables have salon_id
ALTER TABLE staff_services ADD COLUMN salon_id UUID REFERENCES salons(id);
ALTER TABLE break_sessions ADD COLUMN salon_id UUID REFERENCES salons(id);
ALTER TABLE handoff_notifications ADD COLUMN salon_id UUID REFERENCES salons(id);

-- Add composite indexes for performance
CREATE INDEX idx_bookings_salon_time ON bookings(salon_id, booking_time);
CREATE INDEX idx_jobs_salon_status ON active_jobs(salon_id, status);
CREATE INDEX idx_staff_salon ON staff_salons(salon_id, staff_id);
```

### 5.2 Enhance RLS Policies
```sql
-- Template for all tables
CREATE POLICY "tenant_isolation"
ON {table_name}
FOR ALL
USING (
  salon_id IN (
    SELECT salon_id FROM staff_salons WHERE staff_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);
```

---

## Phase 6: Onboarding Flows

### 6.1 Salon Owner Onboarding
**Route**: `/onboarding/salon-owner`

**Flow**:
1. User signs up
2. Create salon record
3. Update user metadata (role = 'salon_owner', salon_id = new_salon_id)
4. Redirect to `/app/{salonId}/dashboard`

### 6.2 Staff Onboarding
**Route**: `/onboarding/staff/:inviteToken`

**Flow**:
1. Staff receives email with invite link
2. Staff signs up
3. Link user to salon via `staff_salons` table
4. Update metadata (role = 'staff', salon_id = assigned_salon)
5. Redirect to `/app/{salonId}/dashboard`

---

## Phase 7: Billing Integration (Stripe)

### 7.1 Subscription Plans
```typescript
const PLANS = {
  BASIC: {
    name: 'Basic',
    maxStaff: 5,
    price: 29,
    features: ['Basic booking', 'Staff management', 'Email support']
  },
  PRO: {
    name: 'Pro',
    maxStaff: 20,
    price: 79,
    features: ['All Basic', 'Analytics', 'API access', 'Priority support']
  },
  UNLIMITED: {
    name: 'Unlimited',
    maxStaff: Infinity,
    price: 199,
    features: ['All Pro', 'Unlimited staff', 'Custom integrations']
  }
};
```

### 7.2 Subscription Middleware
```typescript
// Block access if subscription expired
export const requireActiveSubscription = (salonId: string) => {
  const subscription = await getSubscription(salonId);
  
  if (subscription.status !== 'active') {
    throw new Error('Subscription expired');
  }
};
```

---

## Phase 8: Platform Admin Features

### 8.1 Tenant Management UI
**Route**: `/platform/admin/tenants`

**Features**:
- List all salons
- Suspend/activate salons
- View salon metrics
- Impersonate salon for support

### 8.2 Audit Logging
```typescript
// Log all salon access by super admin
await supabase.from('platform_audit_log').insert({
  user_id: adminId,
  action: 'VIEW_TENANT',
  entity_type: 'salon',
  entity_id: salonId,
  metadata: { reason: 'Support ticket #1234' }
});
```

---

## Testing Strategy

### Unit Tests
- Test tenant isolation logic
- Test RLS policies
- Test auth middleware

### Integration Tests
- Test complete user flows
- Test cross-tenant access prevention
- Test admin impersonation

### Load Tests
- 1000 concurrent salons
- 10,000 concurrent users
- Verify query performance with salon_id indexes

---

## Deployment Checklist

- [ ] All TypeScript errors resolved
- [ ] All queries filter by salon_id
- [ ] RLS policies tested and verified
- [ ] Auth metadata includes salon_id
- [ ] Tenant-aware routing implemented
- [ ] Billing integration complete
- [ ] Admin panel functional
- [ ] Audit logging in place
- [ ] Performance testing complete
- [ ] Security audit passed
- [ ] Documentation updated

---

## Migration Plan (Existing Data)

```sql
-- Step 1: Backup
CREATE TABLE bookings_backup AS SELECT * FROM bookings;

-- Step 2: Assign default salon to orphaned records
UPDATE bookings 
SET salon_id = (SELECT id FROM salons LIMIT 1)
WHERE salon_id IS NULL;

-- Step 3: Add NOT NULL constraint
ALTER TABLE bookings ALTER COLUMN salon_id SET NOT NULL;
```

---

## Estimated Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Phase 1: Foundation | 2-3 days | None |
| Phase 2: Auth Enhancement | 1-2 days | Phase 1 |
| Phase 3: Routing | 2 days | Phase 2 |
| Phase 4: Middleware | 1 day | Phase 3 |
| Phase 5: Database | 1 day | Phase 1 |
| Phase 6: Onboarding | 2-3 days | Phases 2-4 |
| Phase 7: Billing | 3-4 days | Phase 6 |
| Phase 8: Admin Panel | 2-3 days | All previous |
| **Total** | **14-21 days** | N/A |

---

## Next Immediate Steps

1. **Fix remaining build errors** (branch_id → salon_id conversions)
2. **Create type definitions** (`src/types/tenant.ts`)
3. **Update auth hooks** to include salonId
4. **Start route restructuring** (create TenantRoute component)
5. **Add tenant middleware** to all API calls

---

## Questions & Decisions Needed

1. **Subdomain vs Path Routing?**
   - Path: `/app/{salonId}/...` (easier, recommended)
   - Subdomain: `{salon-slug}.yourapp.com` (more complex, better UX)

2. **Hard vs Soft Tenant Isolation?**
   - Hard: Separate DB schemas per tenant (maximum security, complex)
   - Soft: Single schema with salon_id filtering (recommended, easier)

3. **Trial Period?**
   - 14-day free trial recommended
   - Credit card required upfront? (reduces fraud)

4. **Self-Serve Signup?**
   - Allow any salon owner to sign up? (recommended for SaaS)
   - Or require admin approval first? (B2B enterprise model)

---

## Contact & Support

For questions about this transformation:
- Review this document
- Check the current code state
- Test tenant isolation thoroughly before going live

**Remember**: This is a fundamental architectural change. Test extensively!
