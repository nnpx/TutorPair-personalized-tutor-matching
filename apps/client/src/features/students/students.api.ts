import apiClient from '../../services/api-client';
import { useAuthStore } from '../../store/auth.store';
import {
  type ApiResponse,
  type StudentProfileDto,
  type StudentProfileInput,
  type UpdateStudentProfileInput,
  type StudentAvailabilitySlotDto,
  type SetStudentAvailabilityInput,
  type StudentSubjectItemDto,
  type SubjectWithVariantsDto,
  SubjectCategory,
  LearningGoal,
  TutorTypePref,
} from '@tutorpair/shared';

// Purge legacy un-scoped mock keys to prevent cross-account profile bleeding
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('tutorpair_dev_student_profile');
    localStorage.removeItem('tutorpair_dev_student_availability');
    localStorage.removeItem('tutorpair_dev_student_subjects');
  } catch {
    // ignore
  }
}

// Scoped key helper for local dev offline storage
const getDevStorageKey = (prefix: string) => {
  const user = useAuthStore.getState().user;
  return `${prefix}_${user?.id || 'guest'}`;
};

// Reference catalog fixture for offline / local dev mode
export const DEFAULT_SUBJECTS_CATALOG: SubjectWithVariantsDto[] = [
  // 1. GENERAL LEARNING
  {
    id: 'sub-math-id',
    name: 'Mathematics',
    category: SubjectCategory.GENERAL_LEARNING,
    variants: [
      {
        id: 'var-math-school',
        subject_id: 'sub-math-id',
        name: 'School Curriculum Mathematics',
        learning_goal: LearningGoal.SCHOOL_CURRICULUM,
        requires_proof: false,
      },
      {
        id: 'var-math-olympiad',
        subject_id: 'sub-math-id',
        name: 'Math Olympiad & Competitions',
        learning_goal: LearningGoal.COMPETITIONS,
        requires_proof: true,
      },
    ],
  },
  {
    id: 'sub-physics-id',
    name: 'Physics',
    category: SubjectCategory.GENERAL_LEARNING,
    variants: [
      {
        id: 'var-physics-school',
        subject_id: 'sub-physics-id',
        name: 'School Curriculum Physics',
        learning_goal: LearningGoal.SCHOOL_CURRICULUM,
        requires_proof: false,
      },
      {
        id: 'var-physics-olympiad',
        subject_id: 'sub-physics-id',
        name: 'Physics Olympiad (POSN)',
        learning_goal: LearningGoal.COMPETITIONS,
        requires_proof: true,
      },
    ],
  },
  {
    id: 'sub-chemistry-id',
    name: 'Chemistry',
    category: SubjectCategory.GENERAL_LEARNING,
    variants: [
      {
        id: 'var-chemistry-school',
        subject_id: 'sub-chemistry-id',
        name: 'School Curriculum Chemistry',
        learning_goal: LearningGoal.SCHOOL_CURRICULUM,
        requires_proof: false,
      },
      {
        id: 'var-chemistry-olympiad',
        subject_id: 'sub-chemistry-id',
        name: 'Chemistry Olympiad (POSN)',
        learning_goal: LearningGoal.COMPETITIONS,
        requires_proof: true,
      },
    ],
  },
  {
    id: 'sub-biology-id',
    name: 'Biology',
    category: SubjectCategory.GENERAL_LEARNING,
    variants: [
      {
        id: 'var-biology-school',
        subject_id: 'sub-biology-id',
        name: 'School Curriculum Biology',
        learning_goal: LearningGoal.SCHOOL_CURRICULUM,
        requires_proof: false,
      },
      {
        id: 'var-biology-olympiad',
        subject_id: 'sub-biology-id',
        name: 'Medical Biology & POSN Olympiad',
        learning_goal: LearningGoal.COMPETITIONS,
        requires_proof: true,
      },
    ],
  },
  {
    id: 'sub-english-id',
    name: 'English',
    category: SubjectCategory.GENERAL_LEARNING,
    variants: [
      {
        id: 'var-english-grammar',
        subject_id: 'sub-english-id',
        name: 'School English (Grammar & Writing)',
        learning_goal: LearningGoal.SCHOOL_CURRICULUM,
        requires_proof: false,
      },
      {
        id: 'var-english-convo',
        subject_id: 'sub-english-id',
        name: 'Conversational English',
        learning_goal: LearningGoal.PRACTICAL_APPLICATION,
        requires_proof: false,
      },
    ],
  },
  {
    id: 'sub-science-id',
    name: 'General Science',
    category: SubjectCategory.GENERAL_LEARNING,
    variants: [
      {
        id: 'var-science-primary',
        subject_id: 'sub-science-id',
        name: 'Primary & Lower Secondary Science',
        learning_goal: LearningGoal.SCHOOL_CURRICULUM,
        requires_proof: false,
      },
    ],
  },

  // 2. LANGUAGE TESTING
  {
    id: 'sub-ielts-id',
    name: 'IELTS',
    category: SubjectCategory.LANGUAGE_TESTING,
    variants: [
      {
        id: 'var-ielts-academic',
        subject_id: 'sub-ielts-id',
        name: 'IELTS Academic (Target 6.5+)',
        learning_goal: LearningGoal.STANDARDIZED_EXAMS,
        requires_proof: true,
      },
      {
        id: 'var-ielts-general',
        subject_id: 'sub-ielts-id',
        name: 'IELTS General Training',
        learning_goal: LearningGoal.STANDARDIZED_EXAMS,
        requires_proof: true,
      },
    ],
  },
  {
    id: 'sub-toeic-id',
    name: 'TOEIC',
    category: SubjectCategory.LANGUAGE_TESTING,
    variants: [
      {
        id: 'var-toeic-lr',
        subject_id: 'sub-toeic-id',
        name: 'TOEIC Listening & Reading (750+)',
        learning_goal: LearningGoal.STANDARDIZED_EXAMS,
        requires_proof: true,
      },
    ],
  },
  {
    id: 'sub-japanese-id',
    name: 'Japanese',
    category: SubjectCategory.LANGUAGE_TESTING,
    variants: [
      {
        id: 'var-jlpt-n1',
        subject_id: 'sub-japanese-id',
        name: 'JLPT N1 / N2 (Advanced)',
        learning_goal: LearningGoal.STANDARDIZED_EXAMS,
        requires_proof: true,
      },
      {
        id: 'var-jlpt-n4',
        subject_id: 'sub-japanese-id',
        name: 'JLPT N3 / N4 / N5 (Foundation)',
        learning_goal: LearningGoal.STANDARDIZED_EXAMS,
        requires_proof: true,
      },
      {
        id: 'var-japanese-daily',
        subject_id: 'sub-japanese-id',
        name: 'Daily & Business Japanese',
        learning_goal: LearningGoal.PRACTICAL_APPLICATION,
        requires_proof: false,
      },
    ],
  },
  {
    id: 'sub-chinese-id',
    name: 'Chinese (Mandarin)',
    category: SubjectCategory.LANGUAGE_TESTING,
    variants: [
      {
        id: 'var-hsk-4-6',
        subject_id: 'sub-chinese-id',
        name: 'HSK 4-6 (Advanced Chinese)',
        learning_goal: LearningGoal.STANDARDIZED_EXAMS,
        requires_proof: true,
      },
      {
        id: 'var-hsk-1-3',
        subject_id: 'sub-chinese-id',
        name: 'HSK 1-3 (Elementary Chinese)',
        learning_goal: LearningGoal.STANDARDIZED_EXAMS,
        requires_proof: true,
      },
    ],
  },

  // 3. UNIVERSITY ENTRANCE
  {
    id: 'sub-sat-id',
    name: 'Digital SAT',
    category: SubjectCategory.UNIVERSITY_ENTRANCE,
    variants: [
      {
        id: 'var-sat-math',
        subject_id: 'sub-sat-id',
        name: 'Digital SAT Math (700+)',
        learning_goal: LearningGoal.STANDARDIZED_EXAMS,
        requires_proof: true,
      },
      {
        id: 'var-sat-rw',
        subject_id: 'sub-sat-id',
        name: 'Digital SAT Reading & Writing',
        learning_goal: LearningGoal.STANDARDIZED_EXAMS,
        requires_proof: true,
      },
    ],
  },
  {
    id: 'sub-tgat-id',
    name: 'TGAT',
    category: SubjectCategory.UNIVERSITY_ENTRANCE,
    variants: [
      {
        id: 'var-tgat-1',
        subject_id: 'sub-tgat-id',
        name: 'TGAT 1 English Communication',
        learning_goal: LearningGoal.TGAT,
        requires_proof: false,
      },
      {
        id: 'var-tgat-2',
        subject_id: 'sub-tgat-id',
        name: 'TGAT 2 Critical Thinking & Logic',
        learning_goal: LearningGoal.TGAT,
        requires_proof: false,
      },
    ],
  },
  {
    id: 'sub-tpat-id',
    name: 'TPAT',
    category: SubjectCategory.UNIVERSITY_ENTRANCE,
    variants: [
      {
        id: 'var-tpat-1',
        subject_id: 'sub-tpat-id',
        name: 'TPAT 1 Medical Aptitude (GAT-Doctor)',
        learning_goal: LearningGoal.TPAT,
        requires_proof: true,
      },
      {
        id: 'var-tpat-3',
        subject_id: 'sub-tpat-id',
        name: 'TPAT 3 Science & Engineering Aptitude',
        learning_goal: LearningGoal.TPAT,
        requires_proof: false,
      },
    ],
  },
];

export const studentsApi = {
  // 1. Profile & Preferences (TP-58, TP-57, TP-54)
  async getProfile(): Promise<StudentProfileDto | null> {
    try {
      const res = await apiClient.get<ApiResponse<StudentProfileDto>>('/api/students/profile');
      if (!res.data.success || !res.data.data) {
        return null;
      }
      if (import.meta.env.DEV) {
        localStorage.setItem(getDevStorageKey('tutorpair_dev_student_profile'), JSON.stringify(res.data.data));
      }
      return res.data.data;
    } catch (err: unknown) {
      // 404 indicates the authenticated user does not have a profile yet (first-time user)
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return null;
      }

      // Offline fallback: ONLY when network is completely unreachable and user has an existing cached profile
      if (import.meta.env.DEV && !(err as { response?: unknown })?.response) {
        const cached = localStorage.getItem(getDevStorageKey('tutorpair_dev_student_profile'));
        if (cached) {
          try {
            return JSON.parse(cached) as StudentProfileDto;
          } catch {
            return null;
          }
        }
        return null;
      }
      throw err;
    }
  },

  async createProfile(data: StudentProfileInput): Promise<StudentProfileDto> {
    try {
      const res = await apiClient.post<ApiResponse<StudentProfileDto>>('/api/students/profile', data);
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'Failed to create student profile');
      }
      if (import.meta.env.DEV) {
        localStorage.setItem(getDevStorageKey('tutorpair_dev_student_profile'), JSON.stringify(res.data.data));
      }
      return res.data.data;
    } catch (err: unknown) {
      if (import.meta.env.DEV && !(err as { response?: unknown })?.response) {
        console.warn('Backend API unreachable. Falling back to local development mock storage:', err);
        const user = useAuthStore.getState().user;
        const fallbackProfile: StudentProfileDto = {
          user_id: user?.id || 'mock-student-id',
          first_name: data.first_name,
          last_name: data.last_name,
          phone_number: data.phone_number ?? null,
          line_id: data.line_id ?? null,
          grade_level: data.grade_level,
          tutor_type_pref: data.tutor_type_pref,
          style_profile: data.style_profile,
          personality_profile: data.personality_profile,
          budget_max: data.budget_max,
          email: user?.email || 'student@tutorpair.local',
        };
        localStorage.setItem(getDevStorageKey('tutorpair_dev_student_profile'), JSON.stringify(fallbackProfile));
        return fallbackProfile;
      }
      throw err;
    }
  },

  async updateProfile(data: UpdateStudentProfileInput): Promise<StudentProfileDto> {
    try {
      const res = await apiClient.patch<ApiResponse<StudentProfileDto>>('/api/students/profile', data);
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'Failed to update student profile');
      }
      if (import.meta.env.DEV) {
        localStorage.setItem(getDevStorageKey('tutorpair_dev_student_profile'), JSON.stringify(res.data.data));
      }
      return res.data.data;
    } catch (err: unknown) {
      if (import.meta.env.DEV && !(err as { response?: unknown })?.response) {
        console.warn('Backend API unreachable. Falling back to local development mock storage:', err);
        const user = useAuthStore.getState().user;
        const cached = localStorage.getItem(getDevStorageKey('tutorpair_dev_student_profile'));
        const existing: Partial<StudentProfileDto> = cached ? JSON.parse(cached) : {};
        const updated: StudentProfileDto = {
          user_id: existing.user_id || user?.id || 'mock-student-id',
          first_name: data.first_name ?? existing.first_name ?? '',
          last_name: data.last_name ?? existing.last_name ?? '',
          phone_number: data.phone_number !== undefined ? data.phone_number : (existing.phone_number ?? null),
          line_id: data.line_id !== undefined ? data.line_id : (existing.line_id ?? null),
          grade_level: data.grade_level ?? existing.grade_level ?? 'G10',
          tutor_type_pref: data.tutor_type_pref ?? existing.tutor_type_pref ?? TutorTypePref.ANY,
          style_profile: data.style_profile ?? existing.style_profile ?? [3, 3, 3, 3, 3],
          personality_profile: data.personality_profile ?? existing.personality_profile ?? [3, 3, 3, 3],
          budget_max: data.budget_max ?? existing.budget_max ?? 500,
          email: existing.email || user?.email || 'student@tutorpair.local',
        };
        localStorage.setItem(getDevStorageKey('tutorpair_dev_student_profile'), JSON.stringify(updated));
        return updated;
      }
      throw err;
    }
  },

  // 2. Weekly Availability Schedule (TP-54)
  async getAvailability(): Promise<StudentAvailabilitySlotDto[]> {
    try {
      const res = await apiClient.get<ApiResponse<StudentAvailabilitySlotDto[]>>('/api/students/availability');
      if (!res.data.success || !res.data.data) {
        return [];
      }
      if (import.meta.env.DEV) {
        localStorage.setItem(getDevStorageKey('tutorpair_dev_student_availability'), JSON.stringify(res.data.data));
      }
      return res.data.data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return [];
      }
      if (import.meta.env.DEV && !(err as { response?: unknown })?.response) {
        const cached = localStorage.getItem(getDevStorageKey('tutorpair_dev_student_availability'));
        if (cached) {
          try {
            return JSON.parse(cached) as StudentAvailabilitySlotDto[];
          } catch {
            return [];
          }
        }
        return [];
      }
      throw err;
    }
  },

  async setAvailability(data: SetStudentAvailabilityInput): Promise<StudentAvailabilitySlotDto[]> {
    try {
      const res = await apiClient.put<ApiResponse<StudentAvailabilitySlotDto[]>>('/api/students/availability', data);
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'Failed to update student availability');
      }
      if (import.meta.env.DEV) {
        localStorage.setItem(getDevStorageKey('tutorpair_dev_student_availability'), JSON.stringify(res.data.data));
      }
      return res.data.data;
    } catch (err: unknown) {
      if (import.meta.env.DEV && !(err as { response?: unknown })?.response) {
        console.warn('Backend API unreachable. Falling back to local development mock storage:', err);
        localStorage.setItem(getDevStorageKey('tutorpair_dev_student_availability'), JSON.stringify(data.availability));
        return data.availability;
      }
      throw err;
    }
  },

  // 3. Target Subject Requirements
  async getSubjects(): Promise<StudentSubjectItemDto[]> {
    try {
      const res = await apiClient.get<ApiResponse<StudentSubjectItemDto[]>>('/api/students/subjects');
      if (!res.data.success || !res.data.data) {
        return [];
      }
      if (import.meta.env.DEV) {
        localStorage.setItem(getDevStorageKey('tutorpair_dev_student_subjects'), JSON.stringify(res.data.data));
      }
      return res.data.data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return [];
      }
      if (import.meta.env.DEV && !(err as { response?: unknown })?.response) {
        const cached = localStorage.getItem(getDevStorageKey('tutorpair_dev_student_subjects'));
        if (cached) {
          try {
            return JSON.parse(cached) as StudentSubjectItemDto[];
          } catch {
            return [];
          }
        }
        return [];
      }
      throw err;
    }
  },

  async setSubjects(variantIds: string[]): Promise<StudentSubjectItemDto[]> {
    try {
      const res = await apiClient.put<ApiResponse<StudentSubjectItemDto[]>>('/api/students/subjects', {
        variant_ids: variantIds,
      });
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'Failed to update student target subjects');
      }
      if (import.meta.env.DEV) {
        localStorage.setItem(getDevStorageKey('tutorpair_dev_student_subjects'), JSON.stringify(res.data.data));
      }
      return res.data.data;
    } catch (err: unknown) {
      if (import.meta.env.DEV && !(err as { response?: unknown })?.response) {
        console.warn('Backend API unreachable. Falling back to local development mock storage for subjects:', err);
        const mapped: StudentSubjectItemDto[] = [];
        for (const sub of DEFAULT_SUBJECTS_CATALOG) {
          for (const v of sub.variants) {
            if (variantIds.includes(v.id)) {
              mapped.push({
                variant_id: v.id,
                subject_name: sub.name,
                variant_name: v.name,
                category: sub.category,
                learning_goal: v.learning_goal,
              });
            }
          }
        }
        localStorage.setItem(getDevStorageKey('tutorpair_dev_student_subjects'), JSON.stringify(mapped));
        return mapped;
      }
      throw err;
    }
  },

  // 4. Subjects Catalog Reference
  async getSubjectsCatalog(category?: SubjectCategory): Promise<SubjectWithVariantsDto[]> {
    try {
      const params = category ? { category } : {};
      const res = await apiClient.get<ApiResponse<SubjectWithVariantsDto[]>>('/api/subjects', { params });
      if (!res.data.success || !res.data.data) {
        throw new Error(res.data.message || 'Failed to fetch subjects catalog');
      }
      return res.data.data;
    } catch (err: unknown) {
      if (import.meta.env.DEV) {
        if (!category) return DEFAULT_SUBJECTS_CATALOG;
        return DEFAULT_SUBJECTS_CATALOG.filter((s) => s.category === category);
      }
      throw err;
    }
  },
};
