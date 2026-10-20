# Module 4: Admin Tutor Verification — API Specification

This document details the RESTful API endpoints, request/response contracts, security requirements, and architectural rules for **Module 4: Admin Tutor Verification** (`/api/admin`).

---

## 📋 Table of Contents

1. [Architectural Overview & Security](#1-architectural-overview--security)
2. [Data Transfer Objects (DTOs)](#2-data-transfer-objects-dtos)
3. [API Endpoints](#3-api-endpoints)
   - [GET /api/admin/tutors](#1-get-apiadmintutors)
   - [GET /api/admin/tutors/:id](#2-get-apiadmintutorsid)
   - [GET /api/admin/tutors/:id/documents/:docId/view-url](#3-get-apiadmintutorsiddocumentsdocidview-url)
   - [PATCH /api/admin/tutors/:id/verify](#4-patch-apiadmintutorsidverify)
   - [POST /api/admin/tutors/reset-defaults](#5-post-apiadmintutorsreset-defaults)
4. [Queue Logic: First-In, First-Out (FIFO)](#4-queue-logic-first-in-first-out-fifo)
5. [Error Handling & Status Codes](#5-error-handling--status-codes)

---

## 1. Architectural Overview & Security

- **Base Route Prefix:** `/api/admin`
- **Authentication:** Required on all routes via `authenticate` JWT middleware.
- **Authorization:** Strictly restricted to users with `ADMIN` role (`requireRole([UserRole.ADMIN])`).
- **Local Dev Mock Authentication:** Allows `Authorization: Bearer mock-token-admin-1` (or any `mock-token-admin-*`) to bypass Cognito during offline/local testing while establishing an authenticated admin context.
- **S3 Document Security:** Server **never** proxies or streams binary files. Document previews are served exclusively through short-lived (15-minute / 900-second) S3 Presigned GET URLs generated on-demand.

---

## 2. Data Transfer Objects (DTOs)

All types and schemas are shared across the monorepo via `@tutorpair/shared`.

### Verification Status Enum

```typescript
export enum VerificationStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
}
```

### Document Types

```typescript
export enum DocumentType {
  CV = "CV",
  ACADEMIC_TRANSCRIPT = "ACADEMIC_TRANSCRIPT",
  GRADUATION_CERTIFICATE = "GRADUATION_CERTIFICATE",
  SUBJECT_QUALIFICATION = "SUBJECT_QUALIFICATION",
}
```

### Standard Response Envelope

All API endpoints return JSON wrapped inside a consistent `ApiResponse<T>` envelope:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string;
}
```

---

## 3. API Endpoints

### 1. GET `/api/admin/tutors`

Retrieve tutors in the verification queue, with optional status filtering.

- **Headers:**
  - `Authorization: Bearer <jwt-token>`
- **Query Parameters:**
  - `status` _(optional)_: `PENDING` | `APPROVED` | `REJECTED` | `ALL` (defaults to `ALL` if omitted).
- **FIFO Sorting Rule:**
  - When `status=PENDING`: Ordered **chronologically ascending** (`asc(users.created_at)`) so tutors who submitted earliest are reviewed first (First-In, First-Out).
  - When `status=APPROVED`, `REJECTED`, or `ALL`: Ordered **descending** (`desc(users.created_at)`) to show the most recent actions.

#### Response Example (`200 OK`)

```json
{
  "success": true,
  "message": "Tutors queue retrieved successfully",
  "data": [
    {
      "user_id": "tutor-uuid-pending-1",
      "email": "somchai.math@tutorpair.local",
      "first_name": "Somchai",
      "last_name": "Prasert",
      "phone_number": "081-234-5678",
      "profile_photo": null,
      "tutor_type": "FREELANCE",
      "hourly_rate": 650,
      "class_format": "BOTH",
      "verification_status": "PENDING",
      "rejection_reason": null,
      "created_at": "2026-10-18T22:31:12.359Z",
      "document_count": 2,
      "documents_summary": {
        "has_cv": true,
        "has_transcript": true,
        "has_subject_proof": false
      }
    }
  ]
}
```

---

### 2. GET `/api/admin/tutors/:id`

Retrieve full application details of a specific tutor, including their subjects, teaching offerings, personality profiles, and uploaded documents list.

- **Headers:**
  - `Authorization: Bearer <jwt-token>`
- **URL Parameters:**
  - `id`: UUID of the tutor (`tutor.user_id`).

#### Response Example (`200 OK`)

```json
{
  "success": true,
  "message": "Tutor details retrieved successfully",
  "data": {
    "user_id": "tutor-uuid-pending-1",
    "email": "somchai.math@tutorpair.local",
    "first_name": "Somchai",
    "last_name": "Prasert",
    "phone_number": "081-234-5678",
    "profile_photo": null,
    "description": "Chulalongkorn University graduate in Pure Mathematics. 5 years teaching Olympiad and secondary math.",
    "tutor_type": "FREELANCE",
    "style_profile": [2, 3, 4, 2, 3],
    "personality_profile": [2, 1, 3, 2],
    "hourly_rate": 650,
    "class_format": "BOTH",
    "verification_status": "PENDING",
    "rejection_reason": null,
    "created_at": "2026-10-18T22:31:12.359Z",
    "subjects": [
      {
        "variant_id": "var-math-sec",
        "variant_name": "Secondary School Mathematics",
        "subject_name": "Mathematics",
        "category": "GENERAL_LEARNING",
        "grade_levels": ["G7", "G8", "G9", "G10", "G11", "G12"],
        "teaching_focus": "Calculus, Trigonometry, and Exam Prep",
        "requires_proof": false
      }
    ],
    "documents": [
      {
        "id": "doc-somchai-cv",
        "tutor_id": "tutor-uuid-pending-1",
        "document_type": "CV",
        "variant_id": null,
        "variant_name": null,
        "file_key": "tutors/tutor-uuid-pending-1/cv-somchai.pdf",
        "file_size_kb": 1450,
        "uploaded_at": "2026-10-18T22:31:12.359Z"
      }
    ]
  }
}
```

---

### 3. GET `/api/admin/tutors/:id/documents/:docId/view-url`

Generate a secure, time-limited Amazon S3 Presigned GET URL for viewing a tutor document.

- **Headers:**
  - `Authorization: Bearer <jwt-token>`
- **URL Parameters:**
  - `id`: UUID of the tutor.
  - `docId`: UUID of the document.
- **Expiration:** 900 seconds (15 minutes).

#### Response Example (`200 OK`)

```json
{
  "success": true,
  "message": "Document view URL generated successfully",
  "data": {
    "document_id": "doc-somchai-cv",
    "document_type": "CV",
    "file_key": "tutors/tutor-uuid-pending-1/cv-somchai.pdf",
    "file_size_kb": 1450,
    "view_url": "https://tutorpair-documents.s3.ap-southeast-1.amazonaws.com/tutors/tutor-uuid-pending-1/cv-somchai.pdf?AWSAccessKeyId=...&Signature=...&Expires=1761000000",
    "expires_in_seconds": 900
  }
}
```

---

### 4. PATCH `/api/admin/tutors/:id/verify`

Approve or reject a tutor application.

- **Headers:**
  - `Authorization: Bearer <jwt-token>`
  - `Content-Type: application/json`
- **URL Parameters:**
  - `id`: UUID of the tutor.
- **Validation Schema (`VerifyTutorSchema` via Zod):**
  - `status`: `'APPROVED' | 'REJECTED'` (Required).
  - `rejection_reason`: String (Required if `status === 'REJECTED'`, min length 5 characters).
- **Side Effects:**
  - Updates tutor's `verification_status` and `rejection_reason` in the database.
  - Dispatches an in-app notification to the tutor's notification feed.
  - Queues an automated notification email via Amazon SES worker (`notification_events`).

#### Request Body Example (Approval)

```json
{
  "status": "APPROVED"
}
```

#### Request Body Example (Rejection)

```json
{
  "status": "REJECTED",
  "rejection_reason": "The uploaded academic degree document is blurred and lacks official university seal or watermark. Please upload a clear scanned PDF."
}
```

#### Response Example (`200 OK`)

```json
{
  "success": true,
  "message": "Tutor application approved successfully",
  "data": {
    "user_id": "tutor-uuid-pending-1",
    "verification_status": "APPROVED",
    "rejection_reason": null
  }
}
```

---

### 5. POST `/api/admin/tutors/reset-defaults`

Developer / Testing helper to reset mock tutor verification statuses back to standard initial state.

- **Headers:**
  - `Authorization: Bearer <jwt-token>`
- **Response Example (`200 OK`):**

```json
{
  "success": true,
  "message": "Tutor statuses reset to default successfully",
  "data": null
}
```

---

## 4. Queue Logic: First-In, First-Out (FIFO)

To ensure fair review times for tutor applicants:

1. When querying `status=PENDING`, the backend sorts applications by `users.created_at ASC` (oldest submission first).
2. The frontend client automatically targets the oldest pending application (`index === 0`) as `★ #1 Next in Line`.
3. Subsequent applicants are labeled `#2 In Queue`, `#3 In Queue`, etc., based on their chronological order of submission.
4. When `#1` is approved or rejected, the queue advances automatically and the next earliest applicant becomes `#1`.

---

## 5. Error Handling & Status Codes

All errors conform to the standard error handling middleware defined in [`BACKEND_GUIDE.md`](./BACKEND_GUIDE.md):

| Status Code                 | Error Type          | Scenario                                                                            |
| --------------------------- | ------------------- | ----------------------------------------------------------------------------------- |
| `400 Bad Request`           | `ValidationError`   | Missing `rejection_reason` when `status === 'REJECTED'`, or invalid payload schema. |
| `401 Unauthorized`          | `UnauthorizedError` | Missing or invalid JWT authorization token.                                         |
| `403 Forbidden`             | `ForbiddenError`    | Authenticated user does not possess the `ADMIN` role.                               |
| `404 Not Found`             | `NotFoundError`     | Tutor or document ID does not exist.                                                |
| `500 Internal Server Error` | `AppError`          | Unexpected server or database exception.                                            |

#### Error Response Envelope Example

```json
{
  "success": false,
  "message": "Rejection reason is required when rejecting a tutor",
  "data": null,
  "errors": [
    {
      "field": "rejection_reason",
      "message": "Required"
    }
  ]
}
```
