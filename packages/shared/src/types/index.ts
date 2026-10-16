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
