# BMS Pro API Documentation

## Phase 1: Authentication API Layer

This document describes the authentication API layer implemented for the BMS Pro ecosystem.

### Overview

The authentication system uses JWT tokens issued by Supabase Auth and provides a REST API layer that wraps authentication operations. This enables:

- Centralized authentication logic
- Role-based access control (RBAC)
- Branch-level data scoping
- Consistent error handling
- Token refresh mechanisms

### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   React     │         │ Edge         │         │  Supabase   │
│   Client    │────────▶│ Functions    │────────▶│  Database   │
│             │         │ (API Layer)  │         │  + Auth     │
└─────────────┘         └──────────────┘         └─────────────┘
     │                         │
     │                         │
     │  JWT Token              │  Middleware:
     │  in Header              │  - JWT Verification
     │                         │  - RBAC Checks
     │                         │  - Branch Access
     └─────────────────────────┘
```

### API Endpoints

Base URL: `{SUPABASE_URL}/functions/v1/`

All authenticated endpoints require an `Authorization: Bearer {token}` header.

#### 1. POST /api-v1-auth-login

Authenticate a user and receive JWT tokens.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJI...",
  "refreshToken": "refresh_token_string",
  "expiresIn": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "role": "staff" | "admin" | null,
  "branchIds": ["branch-uuid-1", "branch-uuid-2"],
  "defaultBranch": "branch-uuid-1"
}
```

**Errors:**
- `400`: Missing email or password
- `401`: Invalid credentials

---

#### 2. POST /api-v1-auth-refresh

Refresh an expired access token using a refresh token.

**Request:**
```json
{
  "refreshToken": "refresh_token_string"
}
```

**Response (200 OK):**
```json
{
  "token": "new_access_token",
  "refreshToken": "new_refresh_token",
  "expiresIn": 3600
}
```

**Errors:**
- `400`: Missing refresh token
- `401`: Invalid or expired refresh token

---

#### 3. POST /api-v1-auth-logout

Invalidate the current session.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "success": true
}
```

**Errors:**
- `401`: Missing or invalid authorization header

---

#### 4. GET /api-v1-auth-session

Verify current session and get user context.

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "role": "staff" | "admin" | null,
  "branchIds": ["branch-uuid-1"]
}
```

**Errors:**
- `401`: Invalid or expired token

---

### Authentication Middleware

The `_shared/auth-middleware.ts` module provides reusable functions for Edge Functions:

#### `verifyAuth(authHeader: string): Promise<AuthContext>`

Verifies JWT token and returns user context with permissions.

**Returns:**
```typescript
interface AuthContext {
  userId: string;
  email: string;
  role: 'admin' | 'staff' | null;
  branchIds: string[];
}
```

**Usage in Edge Functions:**
```typescript
import { verifyAuth, corsHeaders } from '../_shared/auth-middleware.ts';

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    const context = await verifyAuth(authHeader);
    
    // Use context.userId, context.role, context.branchIds
    // ...
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

#### `requireAdmin(context: AuthContext): void`

Throws error if user is not an admin.

```typescript
requireAdmin(context); // Throws if not admin
// Continue with admin-only logic
```

#### `requireBranchAccess(context: AuthContext, branchId: string): void`

Throws error if user doesn't have access to the specified branch.

```typescript
requireBranchAccess(context, requestedBranchId);
// Continue with branch-specific logic
```

#### `filterByBranchAccess(context: AuthContext, requestedBranchId?: string): string[]`

Returns array of branch IDs the user can access.

```typescript
const allowedBranches = filterByBranchAccess(context, requestedBranchId);
// Use in query filters
```

---

### Client-Side Implementation

#### API Client (`src/lib/api-client.ts`)

The `apiClient` singleton handles all API communication:

**Features:**
- Automatic token attachment
- Token refresh on expiration
- Centralized error handling
- Automatic redirect on session expiry

**Usage:**
```typescript
import { apiClient } from '@/lib/api-client';

// Login
const data = await apiClient.login(email, password);

// Logout
await apiClient.logout();

// Check session
const session = await apiClient.getSession();

// Generic HTTP methods (for future endpoints)
const result = await apiClient.get('endpoint', { param: 'value' });
const result = await apiClient.post('endpoint', { data: 'value' });
const result = await apiClient.put('endpoint', { data: 'value' });
const result = await apiClient.patch('endpoint', { data: 'value' });
const result = await apiClient.delete('endpoint');
```

#### Auth Hook (`src/hooks/useApiAuth.ts`)

React hook for authentication state and actions:

```typescript
import { useApiAuth } from '@/hooks/useApiAuth';

function MyComponent() {
  const {
    user,           // Current user object or null
    role,           // User's role ('admin' | 'staff' | null)
    branchIds,      // Array of accessible branch IDs
    defaultBranch,  // Default branch ID
    loading,        // Loading state
    isAuthenticated,// Boolean authentication status
    login,          // Login function
    logout,         // Logout function
    checkSession,   // Manually check session
  } = useApiAuth();

  const handleLogin = async () => {
    const result = await login(email, password);
    if (result.success) {
      // Automatically redirects based on role
    }
  };

  // ...
}
```

---

## Phase 3: Admin Staff Management Endpoints

These endpoints are **admin-only** and provide staff creation, updates, and deletion capabilities.

### POST /api-v1-admin-staff-create

Create a new staff member with full account setup.

**Authorization:** Admin role required

**Request:**
```json
{
  "email": "staff@example.com",
  "fullName": "Jane Smith",
  "phone": "+1234567890",
  "branchId": "branch-uuid",
  "assignedRole": "staff",
  "hourlyRate": 25.50,
  "specialties": ["Haircut", "Coloring"]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "staff": {
    "id": "uuid",
    "email": "staff@example.com",
    "full_name": "Jane Smith",
    "phone": "+1234567890",
    "hourly_rate": 25.50,
    "specialties": ["Haircut", "Coloring"],
    "user_roles": [{ "role": "staff" }],
    "staff_branches": [{ "branch_id": "branch-uuid", "is_default": true }]
  },
  "message": "Staff member created successfully"
}
```

**Errors:**
- `400`: Missing required fields
- `401`: Invalid or expired token
- `403`: Admin access required
- `500`: Server error during creation

---

### PATCH /api-v1-admin-staff-update

Update an existing staff member's details.

**Authorization:** Admin role required

**Request:**
```json
{
  "staffId": "uuid",
  "fullName": "Jane Doe",
  "phone": "+1234567890",
  "hourlyRate": 30.00,
  "specialties": ["Haircut", "Coloring", "Styling"],
  "defaultBranchId": "branch-uuid",
  "isSuspended": false,
  "role": "admin"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "staff": {
    "id": "uuid",
    "full_name": "Jane Doe",
    "phone": "+1234567890",
    "hourly_rate": 30.00,
    "is_suspended": false,
    "user_roles": [{ "role": "admin" }]
  },
  "message": "Staff member updated successfully"
}
```

**Errors:**
- `400`: Missing staffId
- `401`: Invalid or expired token
- `403`: Admin access required
- `500`: Server error during update

---

### DELETE /api-v1-admin-staff-delete

Delete a staff member account.

**Authorization:** Admin role required

**Query Parameters:**
- `staffId` (required): UUID of the staff member to delete

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Staff member deleted successfully"
}
```

**Errors:**
- `400`: Missing staffId or attempting to delete own account
- `401`: Invalid or expired token
- `403`: Admin access required
- `500`: Server error during deletion

---

### POST /send-staff-invitation

Send an email invitation to a new staff member.

**Authorization:** Admin role required

**Request:**
```json
{
  "email": "newstaff@example.com",
  "branchId": "branch-uuid",
  "assignedRole": "staff",
  "branchName": "Downtown Branch"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Invitation sent successfully"
}
```

**Errors:**
- `400`: Missing required fields
- `401`: Invalid or expired token
- `403`: Admin access required
- `500`: Email sending failed

---

### Security Considerations

1. **JWT Verification**: All protected endpoints verify JWT tokens using Supabase's service role key
2. **Role-Based Access**: Admin-only endpoints check the `user_roles` table
3. **Admin Access Control**: Staff creation, update, and deletion operations are restricted to admin users only
4. **Self-Protection**: Admins cannot delete their own accounts to prevent accidental lockout
3. **Branch Scoping**: Staff members can only access data from their assigned branches
4. **Token Storage**: Tokens stored in localStorage (consider HTTP-only cookies for production)
5. **Token Refresh**: Automatic token refresh prevents session interruption
6. **CORS**: Properly configured for cross-origin requests

---

### Next Steps (Upcoming Phases)

**Phase 2: Staff Endpoints**
- Profile management
- Booking operations
- Job flow (start, pause, resume, complete)
- Break management
- ACSU point awards
- Earnings summary

**Phase 3: Admin - Branch & Staff Management**
- Branch CRUD operations
- Staff CRUD with suspend/activate
- Shift history tracking

**Phase 4: Admin - Booking Management**
- Advanced booking operations
- Bulk operations
- Filtering and search

**Phase 5: Admin - ACSU & Loyalty**
- Loyalty configuration
- Tier management
- Transaction ledger
- Promotions

**Phase 6: Admin - Reports & Feedback**
- KPI endpoints
- Revenue reports
- Staff performance metrics
- Customer feedback management
- Broadcasting

---

### Testing

#### Manual Testing with curl:

**Login:**
```bash
curl -X POST {SUPABASE_URL}/functions/v1/api-v1-auth-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

**Check Session:**
```bash
curl -X GET {SUPABASE_URL}/functions/v1/api-v1-auth-session \
  -H "Authorization: Bearer {token}"
```

**Logout:**
```bash
curl -X POST {SUPABASE_URL}/functions/v1/api-v1-auth-logout \
  -H "Authorization: Bearer {token}"
```

#### Integration Testing:

Test files should be created for:
- `apiClient` token refresh logic
- `useApiAuth` hook state management
- Edge function middleware authorization

---

### Troubleshooting

**401 Unauthorized:**
- Check token is present in request headers
- Verify token hasn't expired
- Check user exists in `user_roles` table

**403 Forbidden:**
- Check user has required role (admin/staff)
- Verify branch access in `staff_branches` table

**Token Refresh Loop:**
- Clear localStorage tokens
- Check refresh token hasn't been revoked
- Verify Supabase Auth configuration

---

### Environment Variables

Edge Functions use these Supabase-provided secrets:
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Public anon key for auth operations
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

Client uses:
- `VITE_SUPABASE_URL` - Supabase project URL (for function calls)

---

### Changelog

**v2.0.0** - Phase 2 Complete
- Staff profile endpoint with branches
- Booking list with pagination & filters
- Booking accept/decline actions
- Job flow management (start/pause/resume/complete/cancel)
- Break management (start/end)
- ACSU points award integration
- Earnings summary with daily breakdown
- Staff API service layer
- Complete TypeScript types

**v1.0.0** - Phase 1 Complete
- JWT-based authentication endpoints
- Token refresh mechanism
- Auth middleware utilities
- React API client
- Auth hook for state management
- AuthPage refactored to use API layer

---

## Phase 2: Staff Endpoints

### GET /api-v1-staff-profile

Get authenticated staff member's complete profile including assigned branches.

**Headers:** `Authorization: Bearer {token}`

**Response (200):**
```json
{
  "profile": {
    "id": "uuid",
    "full_name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "avatar_url": "https://...",
    "bio": "Experienced stylist specializing in...",
    "specialties": ["haircut", "coloring", "styling"],
    "hourly_rate": 25.00,
    "rating": 4.8,
    "total_reviews": 120,
    "availability_status": "available",
    "working_hours": {...},
    "default_branch_id": "branch-uuid",
    "role": "staff"
  },
  "branches": [
    {
      "id": "branch-uuid",
      "isDefault": true,
      "name": "Downtown Branch",
      "address": "123 Main St",
      "phone": "+1234567890",
      "logo_url": "https://..."
    }
  ]
}
```

---

### GET /api-v1-staff-bookings

List staff member's bookings with filtering and pagination.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `status` (optional): Filter by status (pending, confirmed, in_progress, completed, cancelled)
- `branchId` (optional): Filter by specific branch
- `dateFrom` (optional): ISO date string for date range start
- `dateTo` (optional): ISO date string for date range end
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50, max: 100)

**Response (200):**
```json
{
  "bookings": [
    {
      "id": "uuid",
      "staff_id": "uuid",
      "client_name": "Jane Smith",
      "client_email": "jane@example.com",
      "client_phone": "+1234567890",
      "service": "Haircut & Style",
      "price": "45.00",
      "duration": "60",
      "booking_time": "2025-01-15T10:00:00Z",
      "status": "confirmed",
      "notes": "Customer prefers natural products",
      "branch_id": "branch-uuid",
      "created_at": "2025-01-10T08:00:00Z",
      "updated_at": "2025-01-10T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 120,
    "totalPages": 3
  }
}
```

---

### POST /api-v1-staff-booking-action

Accept or decline a booking assignment.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "bookingId": "uuid",
  "action": "accept" | "decline",
  "reason": "Optional reason for declining"
}
```

**Response (200):**
```json
{
  "success": true,
  "bookingId": "uuid",
  "newStatus": "confirmed" | "cancelled"
}
```

**Errors:**
- `400` Invalid action or missing required fields
- `404` Booking not found or staff doesn't have access

**Side Effects:**
- Updates `bookings.status` to `confirmed` or `cancelled`
- Appends decline reason to `bookings.notes` if provided

---

### POST /api-v1-staff-job-action

Manage active job lifecycle through various states.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "jobId": "uuid",  // booking_id for 'start', active_job_id for other actions
  "action": "start" | "pause" | "resume" | "complete" | "cancel",
  "reason": "Optional reason for pause/cancel actions"
}
```

**Action Details:**

**start**: Creates new active job from confirmed booking
- Creates entry in `active_jobs` table
- Updates booking status to `in_progress`
- Logs staff status as `busy` in `status_history`

**pause**: Temporarily suspends active job
- Updates job status to `paused` and records `paused_at` timestamp
- Logs staff status as `on_break`
- Tracks pause reason for reporting

**resume**: Continues paused job
- Calculates paused duration and adds to `total_paused_seconds`
- Changes job status back to `active`
- Updates staff status to `busy`

**complete**: Finishes active job
- Marks job as `completed` with `completed_at` timestamp
- Updates booking status to `completed`
- Changes staff status to `available`
- Job data retained for earnings calculations

**cancel**: Aborts active job
- Removes job from `active_jobs` table
- Updates booking status to `cancelled`
- Appends cancellation reason to booking notes
- Returns staff to `available` status

**Response (200) for 'start':**
```json
{
  "success": true,
  "job": {
    "id": "active-job-uuid",
    "booking_id": "uuid",
    "staff_id": "uuid",
    "branch_id": "uuid",
    "client_name": "Jane Smith",
    "service": "Haircut & Style",
    "price": "45.00",
    "duration": "60",
    "status": "active",
    "started_at": "2025-01-15T10:00:00Z",
    "total_paused_seconds": 0
  }
}
```

**Response (200) for other actions:**
```json
{
  "success": true,
  "action": "pause" | "resume" | "complete" | "cancel"
}
```

**Errors:**
- `400` Invalid action
- `404` Job/booking not found or access denied

---

### POST /api-v1-staff-break

Start or end a break session.

**Headers:** `Authorization: Bearer {token}`

**Start Break Request:**
```json
{
  "action": "start",
  "duration": 15  // Duration in minutes
}
```

**End Break Request:**
```json
{
  "action": "end"
}
```

**Response (200) - Start:**
```json
{
  "success": true,
  "breakSession": {
    "id": "uuid",
    "staff_id": "uuid",
    "break_duration_minutes": 15,
    "started_at": "2025-01-15T12:00:00Z",
    "ends_at": "2025-01-15T12:15:00Z",
    "status": "active"
  }
}
```

**Response (200) - End:**
```json
{
  "success": true
}
```

**Errors:**
- `400` Break already in progress (for start) / Duration required / No active break (for end)
- `404` No active break found (for end)

**Side Effects:**
- Creates/updates entries in `break_sessions` table
- Updates `status_history` with break periods
- Enforces single active break per staff member

---

### POST /api-v1-staff-acsu-award

Award ACSU loyalty points to a customer.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "customerId": "customer-external-id",
  "points": 100,
  "reason": "Excellent service and customer satisfaction",
  "branchId": "branch-uuid"  // optional
}
```

**Response (200):**
```json
{
  "success": true,
  "transaction": {
    "transactionId": "txn_abc123",
    "newBalance": 1350,
    "pointsAwarded": 100,
    "timestamp": "2025-01-15T14:30:00Z",
    "notification": {
      "sent": true,
      "message": "You've earned 100 ACSU points!"
    }
  }
}
```

**Errors:**
- `400` Missing customer ID or invalid points amount
- `500` ACSU API failure

**Side Effects:**
- Calls `acsu-points-award` Edge Function (external ACSU API)
- Logs transaction in `loyalty_transactions` table
- Calculates and stores updated balance
- Triggers customer notification via ACSU

---

### GET /api-v1-staff-earnings

Get comprehensive earnings summary and daily breakdown.

**Headers:** `Authorization: Bearer {token}`

**Query Parameters:**
- `dateFrom` (optional): ISO date string (default: 30 days ago)
- `dateTo` (optional): ISO date string (default: current time)
- `branchId` (optional): Filter by specific branch

**Response (200):**
```json
{
  "summary": {
    "totalJobs": 45,
    "totalHours": 112.5,
    "totalRevenue": 3250.00,
    "estimatedEarnings": 2812.50,
    "hourlyRate": 25.00,
    "averageJobValue": 72.22
  },
  "dailyBreakdown": [
    {
      "date": "2025-01-15",
      "jobs": 8,
      "hours": 7.5,
      "revenue": 580.00
    },
    {
      "date": "2025-01-14",
      "jobs": 7,
      "hours": 6.25,
      "revenue": 520.00
    }
  ]
}
```

**Calculation Logic:**
- **Hours**: `(completed_at - started_at - total_paused_seconds) / 3600`
- **Estimated Earnings**: `totalHours × hourlyRate` from profile
- **Total Revenue**: Sum of all `price` values from completed jobs
- **Average Job Value**: `totalRevenue / totalJobs`

**Data Source:** Only includes jobs with `status = 'completed'` from `active_jobs` table

---

## Client-Side Usage

### Low-Level API Client

```typescript
import { apiClient } from '@/lib/api-client';

// Staff endpoints
const profile = await apiClient.getStaffProfile();
const bookings = await apiClient.getStaffBookings({ 
  status: 'confirmed', 
  page: 1,
  limit: 20 
});
await apiClient.acceptBooking(bookingId);
await apiClient.declineBooking(bookingId, 'Schedule conflict');
await apiClient.startJob(bookingId);
await apiClient.pauseJob(activeJobId, 'Customer phone call');
await apiClient.resumeJob(activeJobId);
await apiClient.completeJob(activeJobId);
await apiClient.cancelJob(activeJobId, 'Customer no-show');
await apiClient.startBreak(15);
await apiClient.endBreak();
await apiClient.awardAcsuPoints('cust_123', 100, 'Great service');
const earnings = await apiClient.getStaffEarnings({ dateFrom, dateTo });
```

### High-Level Staff Service

With automatic toast notifications and error handling:

```typescript
import { staffApi } from '@/services/staff-api';

try {
  const profile = await staffApi.getProfile();
  // Success toast automatically shown
} catch (error) {
  // Error toast automatically shown
  console.error(error);
}

// All methods follow same pattern:
const { bookings, pagination } = await staffApi.getBookings({ status: 'pending' });
await staffApi.acceptBooking(bookingId);  // Shows "Booking accepted successfully"
await staffApi.startJob(bookingId);  // Shows "Job started"
await staffApi.completeJob(jobId);  // Shows "Job completed!"
await staffApi.startBreak(15);  // Shows "Break started for 15 minutes"
await staffApi.awardAcsuPoints(customerId, 100);  // Shows "100 points awarded successfully"
const earnings = await staffApi.getEarnings();
```

### TypeScript Types

```typescript
import type {
  StaffProfile,
  Booking,
  BookingsResponse,
  EarningsSummary,
  DailyBreakdown,
  EarningsResponse,
} from '@/services/staff-api';
```

---

## Next Phase: Admin Endpoints

**Phase 3: Admin - Branch & Staff Management**
- Branch CRUD operations
- Staff CRUD with suspend/activate
- Staff assignments and permissions
- Shift history tracking

Coming soon...
