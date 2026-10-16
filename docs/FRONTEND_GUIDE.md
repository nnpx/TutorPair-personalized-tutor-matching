# TutorPair — Frontend Developer Guide

> This guide covers state management patterns, form handling, route guards, folder conventions, and how the frontend communicates with the backend API.  
> 🎨 **UI & Visual Design**: All visual styling, tokens, and components MUST follow [**`docs/DESIGN_SYSTEM.md`**](./DESIGN_SYSTEM.md) (Zero drop shadows, Flat Design color blocking, and Outfit typography).

---

## 1. State Management Philosophy

We split application state into two clear categories. **Never mix them.**

| State Type | What It Is | Library Used |
|---|---|---|
| **Server State** | Data that lives in the database (tutor profiles, Top 3 results, reviews) | **TanStack Query** |
| **Form State** | Data being entered in a form before it is submitted | **React Hook Form + Zod** |
| **Global Client State** | Data that only exists in the browser (current user, role) | **Zustand** |

---

## 2. TanStack Query (Server State)

Use TanStack Query for **every** API call that reads or writes server data.

### Reading data (queries)

```typescript
// features/matching/hooks/useMatchHistory.ts
import { useQuery } from '@tanstack/react-query';
import { matchingApi } from '../matching.api';

export function useMatchHistory() {
  return useQuery({
    queryKey: ['matchHistory'],         // Unique cache key — be descriptive
    queryFn: matchingApi.getHistory,    // Async function that calls the API
    staleTime: 1000 * 60 * 5,          // Cache for 5 minutes before refetching
  });
}

// In a component:
const { data, isLoading, isError, error } = useMatchHistory();
if (isLoading) return <Spinner />;
if (isError) return <ErrorAlert message={error.message} />;
```

### Writing data (mutations)

```typescript
// features/reviews/hooks/useSubmitReview.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../reviews.api';

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reviewsApi.submitReview,
    onSuccess: () => {
      // Invalidate so the tutor's rating refreshes automatically
      queryClient.invalidateQueries({ queryKey: ['tutor'] });
    },
  });
}

// In a component:
const { mutate, isPending } = useSubmitReview();
mutate(reviewData);
```

### Query Key Conventions

Query keys must be consistent across the app. Follow this pattern:

| Data | Query Key |
|---|---|
| Current student profile | `['students', 'me']` |
| Tutor profile by ID | `['tutors', tutorId]` |
| Top 3 match results | `['matching', 'results', matchRequestId]` |
| Match history for current student | `['matching', 'history']` |
| Admin tutor verification queue | `['admin', 'tutors', 'pending']` |
| Reviews for a tutor | `['reviews', 'tutor', tutorId]` |

---

## 3. React Hook Form + Zod (Form State)

Use React Hook Form for **every** form. Use Zod schemas from `@tutorpair/shared` for validation — never write validation logic manually in the frontend.

```typescript
// features/students/components/StudentProfileForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateStudentProfileSchema } from '@tutorpair/shared';
import type { z } from 'zod';

type FormData = z.infer<typeof UpdateStudentProfileSchema>;

export function StudentProfileForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(UpdateStudentProfileSchema),
  });

  const { mutate } = useUpdateStudentProfile();

  return (
    <form onSubmit={handleSubmit((data) => mutate(data))}>
      <input {...register('phone_number')} />
      {errors.phone_number && <span>{errors.phone_number.message}</span>}
      {/* ...rest of form */}
    </form>
  );
}
```

### Key Rule: Slider Inputs (1–5 scale)

The style and personality sliders are stored as `INT_ARRAY` in the database. In the form, they are individual `number` fields (1–5) that get collected into an array on submit. Use the `SliderInput` component from `components/forms/SliderInput.tsx` for all sliders.

---

## 4. Zustand (Global Client State)

Zustand stores only what needs to be globally available in the browser: the authenticated user's identity and role. This is set once after login and cleared on logout.

```typescript
// store/auth.store.ts
import { create } from 'zustand';
import type { UserRole } from '@tutorpair/shared';

interface AuthStore {
  user: { id: string; email: string; role: UserRole } | null;
  setUser: (user: AuthStore['user']) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
```

**Do not store API response data in Zustand.** That is TanStack Query's job.

---

## 5. API Client (Axios)

All API calls go through the central Axios instance in `services/api-client.ts`. It automatically attaches the Cognito Bearer token to every outgoing request.

```typescript
// services/api-client.ts
import axios from 'axios';
import { fetchAuthSession } from '@aws-amplify/auth';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  // e.g., https://api.tutorpair.com
});

// Request interceptor — attaches JWT to every request
apiClient.interceptors.request.use(async (config) => {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default apiClient;
```

Each feature's `.api.ts` file uses this client:

```typescript
// features/matching/matching.api.ts
import apiClient from '../../services/api-client';

export const matchingApi = {
  runMatch: (data: MatchRequestDto) => apiClient.post('/api/matching', data).then(r => r.data),
  getHistory: () => apiClient.get('/api/matching/history').then(r => r.data),
};
```

---

## 6. Route Guards (Role-Based Access)

Frontend route guards are **UX-only protection** — they prevent accidental navigation to the wrong page. They are NOT a security measure (the backend enforces real security).

### `ProtectedRoute` component

```
routes/
├── index.tsx            # All React Router route definitions
└── ProtectedRoute.tsx   # Wraps routes that require auth and/or a specific role
```

```typescript
// routes/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import type { UserRole } from '@tutorpair/shared';

interface Props {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: Props) {
  const user = useAuthStore((s) => s.user);

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/unauthorized" replace />;

  return <>{children}</>;
}
```

### Route definitions

```typescript
// routes/index.tsx
<Routes>
  {/* Public routes */}
  <Route path="/login" element={<LoginPage />} />

  {/* Student-only routes */}
  <Route path="/student/*" element={
    <ProtectedRoute allowedRoles={['STUDENT']}>
      <StudentLayout />
    </ProtectedRoute>
  }>
    <Route path="matching" element={<MatchingPage />} />
    <Route path="history" element={<MatchHistoryPage />} />
  </Route>

  {/* Admin-only routes */}
  <Route path="/admin/*" element={
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminLayout />
    </ProtectedRoute>
  }>
    <Route path="dashboard" element={<AdminDashboard />} />
  </Route>
</Routes>
```

---

## 7. Environment Variables (Frontend)

Vite exposes env vars prefixed with `VITE_` to the frontend bundle.

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API URL (e.g., `http://localhost:4000` locally) |
| `VITE_COGNITO_USER_POOL_ID` | AWS Cognito User Pool ID |
| `VITE_COGNITO_CLIENT_ID` | AWS Cognito App Client ID |
| `VITE_AWS_REGION` | e.g., `ap-southeast-1` |

Create a `.env.local` file in `apps/client/` from the `.env.example` template. Never commit it.

---

## 8. Feature Folder Rules

- Each feature folder under `features/` maps directly to a backend module.
- Keep all components, hooks, and API functions for a feature inside that feature's folder.
- A component that is used across **more than one feature** belongs in `components/` at the root `src/` level.
- Never import from another feature's folder directly. If shared logic is needed, lift it to `components/` or `hooks/`.

---

## 9. 3-Step Subject Cascade — UI Flow

The subject selection (used in both student preference form and tutor profile form) follows a strict cascading dropdown pattern driven by the backend and `@tutorpair/shared` enums.

```
Step 1: Select Category (SubjectCategory enum)
  → Drives which subjects appear

Step 2: Select Subject (fetched from GET /api/subjects?category={category})
  → Drives which variants appear

Step 3: Select Variant (from subject.variants array)
  → If variant.requires_proof === true → show FileUploadField (tutors only)
  → If variant.learning_goal === 'SCHOOL_CURRICULUM' → show grade level multi-select
  → If variant is a standardized test → hide grade level field entirely
```

Use the `CascadeSubjectDropdown` component in `components/forms/` which encapsulates this logic. Do not re-implement it per-feature.
