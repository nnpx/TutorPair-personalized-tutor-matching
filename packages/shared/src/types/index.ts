import {
  UserRole,
  VerificationStatus,
  NotificationEventType,
  EmailStatus,
  TutorType,
  SubjectCategory,
  LearningGoal,
  DocumentType,
  DayOfWeek,
} from '../enums/index.js';

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
  description: string | null;
  hourly_rate: number;
  average_rating: number;
  review_count: number;
  verification_status: VerificationStatus;
}

export interface TutorProfileDto {
  id?: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  line_id?: string | null;
  description: string | null;
  tutor_type: TutorType;
  style_profile: number[];
  personality_profile: number[];
  hourly_rate?: number | null;
  average_rating: number;
  review_count: number;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudentProfileDto {
  user_id: string;
  email?: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  line_id?: string | null;
  grade_level: string;
  tutor_type_pref: string;
  style_profile: number[];
  personality_profile: number[];
  budget_max: number;
}

export interface StudentAvailabilitySlotDto {
  id?: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

export interface StudentWithAvailabilityDto extends StudentProfileDto {
  availabilities: StudentAvailabilitySlotDto[];
}

export interface StudentSubjectItemDto {
  variant_id: string;
  subject_name: string;
  variant_name: string;
  category: SubjectCategory;
  learning_goal: LearningGoal;
}

export interface TutorSubjectWithDetailsDto {
  variant_id: string;
  subject_id: string;
  subject_name: string;
  variant_name: string;
  category: SubjectCategory;
  learning_goal: LearningGoal;
  requires_proof: boolean;
  hourly_rate: number;
  grade_levels: string[] | null;
  teaching_focus: string | null;
}

export interface TutorAvailabilitySlotDto {
  id?: string;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
}

export interface TutorVerificationStatusDto {
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  documents: Array<{
    id: string;
    document_type: DocumentType;
    file_key: string;
    file_size_kb: number;
    variant_id: string | null;
    uploaded_at: string;
  }>;
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

