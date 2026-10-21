/**
 * NOTE: These interfaces and DTOs are initial baseline drafts.
 * They can be adjusted, expanded, or restructured as the frontend
 * and backend modules are developed in detail.
 */
import { UserRole, VerificationStatus, NotificationEventType, EmailStatus } from '../enums/index.js';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  details?: unknown;
}

export interface UserSession {
  id: string;
  cognito_sub: string;
  email: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface TutorSummaryDto {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  profile_photo: string | null;
  description: string | null;
  hourly_rate: number;
  average_rating: number;
  review_count: number;
  verification_status: VerificationStatus;
}

export interface MatchRecommendationDto {
  id: string;
  tutor_id: string;
  tutor: TutorSummaryDto;
  rank: number;
  score: number;
  is_selected: boolean;
}

export interface MatchResultResponse {
  match_request_id: string;
  recommendations: MatchRecommendationDto[];
}

export interface NotificationDto {
  id: string;
  user_id: string;
  event_type: NotificationEventType;
  message: string;
  is_read: boolean;
  requires_email: boolean;
  email_status: EmailStatus;
  created_at: string;
}

export interface AdminDocumentDto {
  id: string;
  tutor_id: string;
  document_type: string;
  variant_id: string | null;
  variant_name?: string | null;
  file_key: string;
  file_size_kb: number;
  uploaded_at: string;
}

export interface AdminTutorSubjectDto {
  variant_id: string;
  variant_name: string;
  subject_name: string;
  category: string;
  grade_levels: string[] | null;
  teaching_focus: string | null;
  requires_proof: boolean;
}

export interface AdminTutorListItemDto {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_photo: string | null;
  tutor_type: string;
  hourly_rate: number;
  class_format: string;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  created_at: string;
  document_count: number;
  documents_summary: {
    has_cv: boolean;
    has_transcript: boolean;
    has_subject_proof: boolean;
  };
}

export interface AdminTutorDetailDto {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_photo: string | null;
  description: string | null;
  tutor_type: string;
  style_profile: number[];
  personality_profile: number[];
  hourly_rate: number;
  class_format: string;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  created_at: string;
  subjects: AdminTutorSubjectDto[];
  documents: AdminDocumentDto[];
}
