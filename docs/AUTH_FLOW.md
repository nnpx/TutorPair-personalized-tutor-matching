# TutorPair — Authentication & Authorization Flow

> Covers how AWS Cognito, JWT tokens, and the PostgreSQL `users` table work together to authenticate users and enforce role-based access.

---

## Overview

```
┌─────────────┐     1. Sign-up / Sign-in / Google OAuth      ┌───────────────────┐
│  React App  │ ──────────────────────────────────────────→  │   AWS Cognito      │
│ (Amplify)   │ ←──────────────────────────────────────────  │  User Pool         │
└─────────────┘     2. Returns JWT (ID Token + Access Token) └───────────────────┘
       │
       │  3. POST /api/auth/sync  (first login only — with role in body)
       │  GET/POST /api/* (every request — with Authorization: Bearer <token>)
       ▼
┌─────────────┐     4. Verify JWT signature (aws-jwt-verify)  ┌───────────────────┐
│  Express    │ ──────────────────────────────────────────→  │   AWS Cognito      │
│  (ECS)      │     No network call — uses cached JWKS keys   │  JWKS endpoint     │
└─────────────┘                                              └───────────────────┘
       │
       │  5. Lookup cognito_sub → users table → attach req.user
       ▼
┌─────────────┐
│  PostgreSQL │     Stores: id, cognito_sub, email, role, created_at
│  (RDS)      │
└─────────────┘
```

---

## Step-by-Step Flow

### Step 1 — Registration (Frontend)

The React app uses `@aws-amplify/auth` to present sign-up and sign-in forms. AWS Cognito manages the user credential store (email/password, or Google OAuth 2.0).

**After a successful registration:** The user exists in Cognito but NOT yet in the PostgreSQL `users` table. The next step creates the PostgreSQL record.

### Step 2 — First Login Sync (Frontend → Backend)

Immediately after a successful Cognito sign-in, the frontend calls:

```
POST /api/auth/sync
Authorization: Bearer <cognito_id_token>
Body: { "role": "STUDENT" }   ← chosen during registration UI
```

The `auth.service.ts` backend logic:

```
1. authenticate middleware verifies the JWT → extracts cognito_sub, email
2. auth.service checks: does a user with this cognito_sub exist in PostgreSQL?
   - NO  → INSERT INTO users (id, cognito_sub, email, role) → return new user record
   - YES → return existing user record (role cannot be changed after first sync)
3. Return: { id, email, role }
```

The frontend stores `{ id, email, role }` in the Zustand `auth.store`.

### Step 3 — Subsequent API Requests

For every subsequent API call, the Axios interceptor in `services/api-client.ts` automatically reads the current Cognito session and attaches the token:

```
GET /api/students/me/profile
Authorization: Bearer eyJraWQiOiJ...  ← Cognito ID Token
```

### Step 4 — Backend JWT Verification (Every Request)

The `authenticate` middleware in `common/middlewares/authenticate-jwt.ts` runs on every protected route:

```typescript
const verifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  tokenUse: 'id',
  clientId: env.COGNITO_CLIENT_ID,
});

// On first use, downloads JWKS public keys from Cognito and caches them.
// All subsequent verifications are done locally in memory — no network call.
const payload = await verifier.verify(token);
// payload.sub = cognito_sub (e.g., "us-east-1_abc123|google_1234567890")
```

Then looks up the user in PostgreSQL:

```typescript
const user = await userRepository.findByCognitoSub(payload.sub);
if (!user) throw new UnauthorizedError('User not found — please sync your account');
req.user = user;  // { id, email, role, ... }
```

### Step 5 — Role-Based Access Control

The `requireRole` middleware reads `req.user.role` (set by `authenticate`) and compares it against the route's allowed roles:

```typescript
// Only ADMIN can access this route
router.get('/api/admin/tutors', authenticate, requireRole(['ADMIN']), controller.getPendingTutors);

// Both STUDENT and TUTOR can access this
router.get('/api/users/me', authenticate, requireRole(['STUDENT', 'TUTOR']), controller.getMe);
```

The role comes from **PostgreSQL**, not from the JWT token. This means:
- An admin cannot grant themselves elevated access by modifying a JWT (JWT is verified cryptographically).
- Role changes only take effect if changed in the PostgreSQL database by a privileged operation.

### Step 6 — Logout (Frontend)

```typescript
import { signOut } from '@aws-amplify/auth';
await signOut();
useAuthStore.getState().clearUser();  // Clear Zustand store
navigate('/login');
```

Cognito invalidates the token on the Cognito side. The backend does not need to do anything (tokens are stateless and short-lived).

---

## Token Lifetime

| Token | Lifetime | Used For |
|---|---|---|
| ID Token | 1 hour (default) | Sent as `Authorization: Bearer` to backend API |
| Access Token | 1 hour (default) | Used internally by Amplify SDK |
| Refresh Token | 30 days (default) | Used by Amplify to silently issue new ID/Access tokens |

The Amplify Auth SDK handles token refresh automatically. When a token is near expiry, `fetchAuthSession()` returns a fresh token transparently.

---

## Role Reference

| Role | PostgreSQL Enum Value | Accessible Routes |
|---|---|---|
| Student | `STUDENT` | `/api/students/*`, `/api/matching/*`, `/api/reviews/*` |
| Tutor | `TUTOR` | `/api/tutors/*`, `/api/documents/*` |
| Admin | `ADMIN` | `/api/admin/*` + read access to tutor/document routes |

---

## Security Notes

- **JWT tokens are verified cryptographically** using Cognito's public JWKS keys. A tampered token is rejected immediately.
- **Roles are stored in PostgreSQL**, not in the JWT. Cognito has no knowledge of our custom roles.
- **Tutors cannot change their own verification status.** The `admin` module routes that change `verification_status` are gated by `requireRole(['ADMIN'])`.
- **Passwords are never stored** by TutorPair. Cognito manages all credentials.
- **Google OAuth users** follow the same flow. After Google sign-in via Cognito, Cognito issues a standard JWT and our backend treats it identically to an email/password user.
