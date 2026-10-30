import apiClient from '../../services/api-client';
import type {
  ApiResponse,
  StudentProfileDto,
  StudentProfileInput,
  UpdateStudentProfileInput,
  StudentAvailabilitySlotDto,
  SetStudentAvailabilityInput,
  StudentSubjectItemDto,
  SubjectWithVariantsDto,
  SubjectCategory,
} from '@tutorpair/shared';

export const studentsApi = {
  // 1. Profile & Preferences (TP-58, TP-57, TP-54)
  async getProfile(): Promise<StudentProfileDto | null> {
    try {
      const res = await apiClient.get<ApiResponse<StudentProfileDto>>('/api/students/profile');
      if (!res.data.success || !res.data.data) {
        return null;
      }
      return res.data.data;
    } catch (err: unknown) {
      // 404 indicates the authenticated user does not have a profile yet (first-time user)
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return null;
      }
      throw err;
    }
  },

  async createProfile(data: StudentProfileInput): Promise<StudentProfileDto> {
    const res = await apiClient.post<ApiResponse<StudentProfileDto>>('/api/students/profile', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to create student profile');
    }
    return res.data.data;
  },

  async updateProfile(data: UpdateStudentProfileInput): Promise<StudentProfileDto> {
    const res = await apiClient.patch<ApiResponse<StudentProfileDto>>('/api/students/profile', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to update student profile');
    }
    return res.data.data;
  },

  // 2. Weekly Availability Schedule (TP-54)
  async getAvailability(): Promise<StudentAvailabilitySlotDto[]> {
    try {
      const res = await apiClient.get<ApiResponse<StudentAvailabilitySlotDto[]>>('/api/students/availability');
      if (!res.data.success || !res.data.data) {
        return [];
      }
      return res.data.data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return [];
      }
      throw err;
    }
  },

  async setAvailability(data: SetStudentAvailabilityInput): Promise<StudentAvailabilitySlotDto[]> {
    const res = await apiClient.put<ApiResponse<StudentAvailabilitySlotDto[]>>('/api/students/availability', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to update student availability');
    }
    return res.data.data;
  },

  // 3. Target Subject Requirements
  async getSubjects(): Promise<StudentSubjectItemDto[]> {
    try {
      const res = await apiClient.get<ApiResponse<StudentSubjectItemDto[]>>('/api/students/subjects');
      if (!res.data.success || !res.data.data) {
        return [];
      }
      return res.data.data;
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        return [];
      }
      throw err;
    }
  },

  async setSubjects(variantIds: string[]): Promise<StudentSubjectItemDto[]> {
    const res = await apiClient.put<ApiResponse<StudentSubjectItemDto[]>>('/api/students/subjects', {
      variant_ids: variantIds,
    });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to update student target subjects');
    }
    return res.data.data;
  },

  // 4. Subjects Catalog Reference
  async getSubjectsCatalog(category?: SubjectCategory): Promise<SubjectWithVariantsDto[]> {
    const params = category ? { category } : {};
    const res = await apiClient.get<ApiResponse<SubjectWithVariantsDto[]>>('/api/subjects', { params });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch subjects catalog');
    }
    return res.data.data;
  },
};
