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
  MatchRequestStatus,
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
  consent_display_cv: boolean;
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
  document_type: DocumentType;
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
  tutor_type: string;
  hourly_rate: number;
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
  description: string | null;
  tutor_type: string;
  style_profile: number[];
  personality_profile: number[];
  hourly_rate: number;
  verification_status: VerificationStatus;
  rejection_reason: string | null;
  created_at: string;
  subjects: AdminTutorSubjectDto[];
  documents: AdminDocumentDto[];
}

// ---- Module 6: Tutor Matching ----

/** Public tutor card in match results. Never carries contact details or verification data. */
export interface PublicTutorCardDto {
  tutor_id: string;
  first_name: string;
  last_name: string;
  description: string | null;
  tutor_type: TutorType;
  average_rating: number;
  review_count: number;
  hourly_rate: number;
  teaching_focus: string | null;
}

export interface MatchRecommendationDto {
  recommendation_id: string;
  rank: number;
  score: number;
  tutor: PublicTutorCardDto;
}

export interface MatchResultDto {
  match_request_id: string;
  variant_id: string;
  status: MatchRequestStatus;
  recommendations: MatchRecommendationDto[];
}

export interface ConfirmSelectionResultDto {
  match_request_id: string;
  status: MatchRequestStatus;
  selected: {
    recommendation_id: string;
    tutor_id: string;
    first_name?: string;
    last_name?: string;
    phone_number?: string | null;
    line_id?: string | null;
    email?: string | null;
  };
}

// ---- Module 7: Results, History & Reviews (TP-10, TP-19, TP-30, TP-34, TP-35) ----

export interface ConfirmedTutorDetailsDto {
  recommendation_id: string;
  tutor_id: string;
  first_name: string;
  last_name: string;
  phone_number?: string | null;
  line_id?: string | null;
  email?: string | null;
  hourly_rate: number;
  tutor_type: TutorType;
  average_rating: number;
  review_count: number;
  has_reviewed: boolean;
  review_id?: string | null;
}

export interface MatchHistoryItemDto {
  match_request_id: string;
  variant_id: string;
  subject_name: string;
  variant_name: string;
  category: SubjectCategory;
  status: MatchRequestStatus;
  created_at: string;
  recommendations: MatchRecommendationDto[];
  selected: ConfirmedTutorDetailsDto | null;
}

export interface DetailedTutorPublicDto {
  tutor_id: string;
  first_name: string;
  last_name: string;
  description: string | null;
  tutor_type: TutorType;
  hourly_rate: number;
  teaching_focus: string | null;
  style_profile: number[];
  personality_profile: number[];
  average_rating: number;
  review_count: number;
  subjects: Array<{
    variant_id: string;
    subject_name: string;
    variant_name: string;
    category: SubjectCategory;
    hourly_rate: number;
    grade_levels: string[] | null;
    teaching_focus: string | null;
  }>;
  contact_unlocked: boolean;
  phone_number?: string | null;
  line_id?: string | null;
  email?: string | null;
  cv_url?: string | null;
  confirmed_recommendation_id?: string | null;
  has_reviewed?: boolean;
}

export interface ReviewItemDto {
  id: string;
  student_id: string;
  student_name: string;
  tutor_id: string;
  recommendation_id: string;
  rating_knowledge: number;
  rating_preparation: number;
  rating_clarity: number;
  rating_punctuality: number;
  overall_rating: number;
  comment: string | null;
  created_at: string;
}

export interface TutorReviewsSummaryDto {
  tutor_id: string;
  average_rating: number;
  review_count: number;
  rating_breakdown: {
    knowledge: number;
    preparation: number;
    clarity: number;
    punctuality: number;
  };
  reviews: ReviewItemDto[];
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

export interface NotificationListResponseDto {
  notifications: NotificationDto[];
  unread_count: number;
}

export interface MatchedStudentDto {
  match_request_id: string;
  student_id: string;
  student_name: string;
  first_name: string;
  last_name: string;
  grade_level: string;
  phone_number: string | null;
  line_id: string | null;
  email: string | null;
  subject_name: string;
  variant_name: string;
  category: SubjectCategory;
  hourly_rate: number;
  confirmed_at: string;
  style_profile: number[];
  personality_profile: number[];
}

/** Public bell payload; email dispatch internals stay on the server. */
export interface TutorNotificationItem {
  id: string;
  event_type: `${NotificationEventType}`;
  message: string;
  is_read: boolean;
  created_at: string;
}
export interface TutorNotificationList {
  items: TutorNotificationItem[];
  unreadCount: number;
}
