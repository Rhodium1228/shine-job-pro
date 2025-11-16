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

### Security Considerations

1. **JWT Verification**: All protected endpoints verify JWT tokens using Supabase's service role key
2. **Role-Based Access**: Admin-only endpoints check the `user_roles` table
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

**v1.0.0** - Phase 1 Complete
- JWT-based authentication endpoints
- Token refresh mechanism
- Auth middleware utilities
- React API client
- Auth hook for state management
- AuthPage refactored to use API layer
