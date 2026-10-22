# API Specification — Module 4: Tutor Profile & Verification

> **Base URL:** `http://localhost:4000/api` (local) | `https://api.tutorpair.com/api` (production)
>
> **Authentication:** `Authorization: Bearer <cognito-jwt>`
> Local mock bypass: `Authorization: Bearer mock-token-<user-id>` (see [`AUTH_FLOW.md`](./AUTH_FLOW.md))
>
> **Access Role:** All endpoints in this module require `TUTOR` role enforced via backend `requireRole(['TUTOR'])` middleware.
>
> **Format Note:** All tutoring sessions and matchmaking are conducted **Online by default**.

---

## How the Backend Identifies the Tutor

Clients **do not** pass a `tutor_id` in the URL or query parameters for self-service endpoints (like `GET /tutors/profile`, `PUT /tutors/subjects`, etc.).

Identity is resolved securely from the authentication token:
1. The frontend sends the Bearer JWT token in the `Authorization` header:
   ```http
   Authorization: Bearer <cognito-access-token>
   ```
2. The `authenticate` middleware validates the token, extracts the authenticated user's Cognito `sub` (or mock ID in dev), and retrieves their record from the PostgreSQL `users` table.
3. The user record is attached to the Express request object as `req.user` (`req.user.id`).
4. The controller and service use `req.user.id` directly to query:
   ```sql
   SELECT * FROM tutors WHERE user_id = req.user.id;
   ```
5. **Security Benefit:** Tutors can never view, overwrite, or tamper with another tutor's profile by manipulating URL parameters.

---

## Response Envelope & Conventions

All API responses strictly implement the [`ApiResponse<T>`](../packages/shared/src/types/index.ts) contract formatted via [`apps/server/src/common/utils/response.util.ts`](../apps/server/src/common/utils/response.util.ts).

### 1. Success Response Structure

```json
{
  "success": true,
  "data": { ... },
  "message": "Optional operation message"
}
```

### 2. Standard Error Response Structure

Error responses are handled centrally by [`errorHandler`](../apps/server/src/common/errors/error-handler.ts) using `AppError` subclasses from [`apps/server/src/common/errors/http-errors.ts`](../apps/server/src/common/errors/http-errors.ts):

```json
{
  "success": false,
  "message": "Human-readable error description",
  "details": null
}
```

**Validation Error Example (`400 Bad Request` / Zod Validation):**

```json
{
  "success": false,
  "message": "Validation failed",
  "details": [
    {
      "field": "phone_number",
      "message": "Phone number is required"
    },
    {
      "field": "style_profile",
      "message": "Style profile requires exactly 5 ratings"
    }
  ]
}
```

### 3. HTTP Status Codes

| Status Code | Error Class | When Used |
|---|---|---|
| `200 OK` | — | Successful query or update operation |
| `201 Created` | — | Successful profile creation (`POST /tutors/profile`) |
| `400 Bad Request` | `BadRequestError` | Request body fails Zod schema validation or invalid syntax |
| `401 Unauthorized` | `UnauthorizedError` | Missing or invalid Cognito JWT bearer token |
| `403 Forbidden` | `ForbiddenError` | Authenticated user is not a `TUTOR` |
| `404 Not Found` | `NotFoundError` | Tutor profile, subject variant, or record does not exist |
| `409 Conflict` | `ConflictError` | Tutor profile already exists for this user |
| `422 Unprocessable Entity` | `UnprocessableEntityError` | Semantically invalid input violating business rules |
| `500 Internal Server Error` | `InternalServerError` | Unhandled server or database exception |

---

## Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/tutors/profile` | Retrieve the authenticated tutor's full profile |
| `POST` | `/tutors/profile` | **Create** tutor profile (used once on onboarding page) |
| `PATCH` | `/tutors/profile` | **Edit** tutor profile (used on settings page for partial updates) |
| `GET` | `/tutors/subjects` | List all subjects and variants taught by the tutor |
| `PUT` | `/tutors/subjects` | Replace tutor's complete list of taught subjects |
| `GET` | `/tutors/availability` | Get tutor's recurring weekly availability slots |
| `PUT` | `/tutors/availability` | Replace tutor's recurring weekly availability schedule |
| `GET` | `/tutors/verification` | Check tutor's verification status and uploaded documents |

---

## 1. Personal Profile

### `GET /tutors/profile`

- **Use Case:**
  - **Dashboard & Settings Initialization:** Invoked immediately when a tutor signs in or navigates to their profile page.
  - Loads the tutor's personal information, hourly rate, 5 teaching style slider scores, 4 personality slider scores, and current verification status (`PENDING`, `APPROVED`, `REJECTED`) along with any admin rejection feedback.
  - Target tutor is identified by `req.user.id` from the JWT token.

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "user_id": "8a3d5f30-8041-454d-b636-f0dfbb98305c",
    "first_name": "Somchai",
    "last_name": "Jaidee",
    "phone_number": "0812345678",
    "description": "Experienced mathematics and physics tutor with 4 years of exam preparation experience.",
    "tutor_type": "UNDERGRADUATE",
    "style_profile": [4, 5, 3, 4, 2],
    "personality_profile": [5, 4, 4, 3],
    "hourly_rate": 450.00,
    "verification_status": "APPROVED",
    "rejection_reason": null,
    "average_rating": 4.85,
    "review_count": 14
  }
}
```

> **Field Notes:**
> - `tutor_type`: `UNDERGRADUATE` | `FREELANCE` | `INSTITUTIONAL`
> - `style_profile`: Array of exactly 5 integers between 1 and 5 (teaching style preferences).
> - `personality_profile`: Array of exactly 4 integers between 1 and 5 (personality dimensions).
> - `verification_status`: `PENDING` | `APPROVED` | `REJECTED`
> - Tutoring format is online by default.

---

### `POST /tutors/profile`

- **Use Case:**
  - **Create Profile (Onboarding Form Submission):** Invoked once on the onboarding page when a newly registered tutor fills out and submits their profile form for the first time.
  - Inserts a new record into the `tutors` table keyed by `req.user.id`.
  - Validated strictly against `TutorProfileSchema`.

**Request Body** (`TutorProfileInput`)

```json
{
  "first_name": "Somchai",
  "last_name": "Jaidee",
  "phone_number": "0812345678",
  "description": "Experienced mathematics and physics tutor with 4 years of exam preparation experience.",
  "tutor_type": "UNDERGRADUATE",
  "style_profile": [4, 5, 3, 4, 2],
  "personality_profile": [5, 4, 4, 3],
  "hourly_rate": 450.00
}
```

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "user_id": "8a3d5f30-8041-454d-b636-f0dfbb98305c",
    "first_name": "Somchai",
    "last_name": "Jaidee",
    "phone_number": "0812345678",
    "description": "Experienced mathematics and physics tutor with 4 years of exam preparation experience.",
    "tutor_type": "UNDERGRADUATE",
    "style_profile": [4, 5, 3, 4, 2],
    "personality_profile": [5, 4, 4, 3],
    "hourly_rate": 450.00,
    "verification_status": "PENDING",
    "rejection_reason": null,
    "average_rating": 0.00,
    "review_count": 0
  },
  "message": "Tutor profile created successfully"
}
```

---

### `PATCH /tutors/profile`

- **Use Case:**
  - **Edit Profile:** Invoked when an existing tutor edits specific attributes (e.g. updating phone number, revising bio description, or adjusting hourly rate) from account settings.
  - Updates only the fields provided in the payload.
  - Validated against `UpdateTutorProfileSchema` (all fields optional).

**Request Body** (`UpdateTutorProfileInput` — any subset of fields)

```json
{
  "hourly_rate": 500.00,
  "description": "Updated bio: Specializing in intensive exam workshops and online problem sessions."
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "user_id": "8a3d5f30-8041-454d-b636-f0dfbb98305c",
    "first_name": "Somchai",
    "last_name": "Jaidee",
    "phone_number": "0812345678",
    "description": "Updated bio: Specializing in intensive exam workshops and online problem sessions.",
    "tutor_type": "UNDERGRADUATE",
    "style_profile": [4, 5, 3, 4, 2],
    "personality_profile": [5, 4, 4, 3],
    "hourly_rate": 500.00,
    "verification_status": "APPROVED",
    "rejection_reason": null,
    "average_rating": 4.85,
    "review_count": 14
  },
  "message": "Tutor profile updated successfully"
}
```

---

## 2. Subjects & Specializations

### `GET /tutors/subjects`

- **Use Case:**
  - **Tutor Subject Settings / Matching Discovery:** Fetches the list of all subject variants the tutor is registered to teach.
  - Displays each subject variant along with targeted grade levels (e.g., `["G10", "G11", "G12"]`) and teaching focus tags (e.g., "A-Level preparation", "Foundation skills").

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "subjects": [
      {
        "variant_id": "4b5d6e7f-8a9b-0c1d-2e3f-4a5b6c7d8e9f",
        "subject_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "subject_name": "Mathematics",
        "variant_name": "School Curriculum",
        "category": "GENERAL_LEARNING",
        "learning_goal": "SCHOOL_CURRICULUM",
        "requires_proof": false,
        "grade_levels": ["G10", "G11", "G12"],
        "teaching_focus": "Curriculum strengthening and homework assistance"
      },
      {
        "variant_id": "7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
        "subject_id": "1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
        "subject_name": "Mathematics",
        "variant_name": "A-Level Math",
        "category": "UNIVERSITY_ENTRANCE",
        "learning_goal": "A_LEVEL",
        "requires_proof": true,
        "grade_levels": ["G12"],
        "teaching_focus": "Intensive mock testing and speed problem solving"
      }
    ]
  }
}
```

---

### `PUT /tutors/subjects`

- **Use Case:**
  - **Subject Offering Management:** Invoked when the tutor updates their catalog of offered subjects via the 3-step cascading subject selector (Category -> Subject -> Variant).
  - Performs a full atomic overwrite of the tutor's records in the `tutor_subjects` join table for `req.user.id`.
  - Validated against `SetTutorSubjectsSchema`.

**Request Body** (`SetTutorSubjectsInput`)

```json
{
  "subjects": [
    {
      "variant_id": "4b5d6e7f-8a9b-0c1d-2e3f-4a5b6c7d8e9f",
      "grade_levels": ["G10", "G11", "G12"],
      "teaching_focus": "Curriculum strengthening and homework assistance"
    },
    {
      "variant_id": "7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
      "grade_levels": ["G12"],
      "teaching_focus": "Intensive mock testing and speed problem solving"
    }
  ]
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "subjects": [
      {
        "variant_id": "4b5d6e7f-8a9b-0c1d-2e3f-4a5b6c7d8e9f",
        "grade_levels": ["G10", "G11", "G12"],
        "teaching_focus": "Curriculum strengthening and homework assistance"
      },
      {
        "variant_id": "7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
        "grade_levels": ["G12"],
        "teaching_focus": "Intensive mock testing and speed problem solving"
      }
    ]
  },
  "message": "Tutor subjects updated successfully"
}
```

---

## 3. Availability & Schedule

### `GET /tutors/availability`

- **Use Case:**
  - **Schedule Overview:** Invoked on the tutor's calendar/availability settings page.
  - Fetches all recurring weekly available time windows configured by the tutor.

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "availability": [
      {
        "id": "9f8e7d6c-5b4a-3f2e-1d0c-9b8a7f6e5d4c",
        "day_of_week": "MONDAY",
        "start_time": "17:00",
        "end_time": "20:00"
      },
      {
        "id": "1b2c3d4e-5f6a-7b8c-9d0e-1f2a3b4c5d6e",
        "day_of_week": "SATURDAY",
        "start_time": "09:00",
        "end_time": "12:00"
      },
      {
        "id": "3e4f5a6b-7c8d-9e0f-1a2b-3c4d5e6f7a8b",
        "day_of_week": "SATURDAY",
        "start_time": "13:00",
        "end_time": "17:00"
      }
    ]
  }
}
```

> **Field Notes:**
> - `day_of_week`: `MONDAY` | `TUESDAY` | `WEDNESDAY` | `THURSDAY` | `FRIDAY` | `SATURDAY` | `SUNDAY`
> - `start_time` / `end_time`: 24-hour format string `HH:MM`

---

### `PUT /tutors/availability`

- **Use Case:**
  - **Weekly Schedule Update:** Invoked when the tutor modifies their weekly availability grid.
  - Replaces all recurring availability records for `req.user.id` in the `availabilities` table.

**Request Body**

```json
{
  "availability": [
    {
      "day_of_week": "MONDAY",
      "start_time": "17:00",
      "end_time": "20:00"
    },
    {
      "day_of_week": "WEDNESDAY",
      "start_time": "17:00",
      "end_time": "20:00"
    },
    {
      "day_of_week": "SATURDAY",
      "start_time": "09:00",
      "end_time": "16:00"
    }
  ]
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "availability": [
      {
        "id": "d0e1f2a3-b4c5-6d7e-8f9a-0b1c2d3e4f5a",
        "day_of_week": "MONDAY",
        "start_time": "17:00",
        "end_time": "20:00"
      },
      {
        "id": "e1f2a3b4-c56d-7e8f-9a0b-1c2d3e4f5a6b",
        "day_of_week": "WEDNESDAY",
        "start_time": "17:00",
        "end_time": "20:00"
      },
      {
        "id": "f2a3b4c5-6d7e-8f9a-0b1c-2d3e4f5a6b7c",
        "day_of_week": "SATURDAY",
        "start_time": "09:00",
        "end_time": "16:00"
      }
    ]
  },
  "message": "Availability schedule updated successfully"
}
```

---

## 4. Verification Status & Documents

### `GET /tutors/verification`

- **Use Case:**
  - **Verification Status Tracking & Document Review:** Invoked on the tutor's verification status page.
  - Allows the tutor to see whether their verification is `PENDING`, `APPROVED`, or `REJECTED`, check rejection feedback from administrators, and inspect metadata of documents submitted (CVs, transcripts, certificates).
  - *Note:* File upload and S3 presigned URL generation are managed via the dedicated Documents module (`/documents/presigned-upload` and `/documents/confirm` per [`S3_DOCUMENTS.md`](./S3_DOCUMENTS.md)).

**Response `200 OK`**

```json
{
  "success": true,
  "data": {
    "verification_status": "PENDING",
    "rejection_reason": null,
    "documents": [
      {
        "id": "5a6b7c8d-9e0f-1a2b-3c4d-5e6f7a8b9c0d",
        "document_type": "DEGREE_TRANSCRIPT",
        "file_key": "tutors/8a3d5f30-8041-454d-b636-f0dfbb98305c/degree_transcript.pdf",
        "file_size_kb": 1420,
        "variant_id": null,
        "uploaded_at": "2024-01-15T08:30:00Z"
      },
      {
        "id": "6b7c8d9e-0f1a-2b3c-4d5e-6f7a8b9c0d1e",
        "document_type": "SUBJECT_QUALIFICATION",
        "file_key": "tutors/8a3d5f30-8041-454d-b636-f0dfbb98305c/alevel_score.pdf",
        "file_size_kb": 850,
        "variant_id": "7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
        "uploaded_at": "2024-01-15T08:35:00Z"
      }
    ]
  }
}
```

> **Field Notes:**
> - `verification_status`: `PENDING` | `APPROVED` | `REJECTED`
> - `document_type`: `DEGREE_TRANSCRIPT` | `CV` | `SUBJECT_QUALIFICATION`
> - If `verification_status` is `REJECTED`, `rejection_reason` provides guidance from the administrator on what correction is needed.
