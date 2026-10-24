import apiClient from '../../services/api-client';
import type {
  ApiResponse,
  TutorProfileDto,
  TutorProfileInput,
  UpdateTutorProfileInput,
  TutorSubjectWithDetailsDto,
  SetTutorSubjectsInput,
  TutorAvailabilitySlotDto,
  SetTutorAvailabilityInput,
  TutorVerificationStatusDto,
  SubjectWithVariantsDto,
  SubjectCategory,
  PresignedUploadRequestInput,
  ConfirmUploadInput,
} from '@tutorpair/shared';

export const tutorsApi = {
  // 1. Profile
  async getProfile(): Promise<TutorProfileDto> {
    const res = await apiClient.get<ApiResponse<TutorProfileDto>>('/api/tutors/profile');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch tutor profile');
    }
    return res.data.data;
  },

  async createProfile(data: TutorProfileInput): Promise<TutorProfileDto> {
    const res = await apiClient.post<ApiResponse<TutorProfileDto>>('/api/tutors/profile', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to create tutor profile');
    }
    return res.data.data;
  },

  async updateProfile(data: UpdateTutorProfileInput): Promise<TutorProfileDto> {
    const res = await apiClient.patch<ApiResponse<TutorProfileDto>>('/api/tutors/profile', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to update tutor profile');
    }
    return res.data.data;
  },

  // 2. Subjects
  async getSubjects(): Promise<TutorSubjectWithDetailsDto[]> {
    const res = await apiClient.get<ApiResponse<{ subjects: TutorSubjectWithDetailsDto[] }>>('/api/tutors/subjects');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch tutor subjects');
    }
    return res.data.data.subjects;
  },

  async setSubjects(data: SetTutorSubjectsInput): Promise<TutorSubjectWithDetailsDto[]> {
    const res = await apiClient.put<ApiResponse<{ subjects: TutorSubjectWithDetailsDto[] }>>('/api/tutors/subjects', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to update tutor subjects');
    }
    return res.data.data.subjects;
  },

  // 3. Availability
  async getAvailability(): Promise<TutorAvailabilitySlotDto[]> {
    const res = await apiClient.get<ApiResponse<{ availability: TutorAvailabilitySlotDto[] }>>('/api/tutors/availability');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch tutor availability');
    }
    return res.data.data.availability;
  },

  async setAvailability(data: SetTutorAvailabilityInput): Promise<TutorAvailabilitySlotDto[]> {
    const res = await apiClient.put<ApiResponse<{ availability: TutorAvailabilitySlotDto[] }>>('/api/tutors/availability', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to update tutor availability');
    }
    return res.data.data.availability;
  },

  // 4. Verification Status
  async getVerification(): Promise<TutorVerificationStatusDto> {
    const res = await apiClient.get<ApiResponse<TutorVerificationStatusDto>>('/api/tutors/verification');
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch verification status');
    }
    return res.data.data;
  },

  // 5. Subjects Reference Catalog (Cascading Selector)
  async getSubjectsCatalog(category?: SubjectCategory): Promise<SubjectWithVariantsDto[]> {
    const params = category ? { category } : {};
    const res = await apiClient.get<ApiResponse<SubjectWithVariantsDto[]>>('/api/subjects', { params });
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to fetch subjects catalog');
    }
    return res.data.data;
  },

  // 6. S3 Document Upload Workflow
  async requestPresignedUpload(data: PresignedUploadRequestInput): Promise<{ uploadUrl: string; fileKey: string }> {
    const res = await apiClient.post<ApiResponse<{ uploadUrl: string; fileKey: string }>>(
      '/api/documents/presigned-upload',
      data
    );
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to generate upload URL');
    }
    return res.data.data;
  },

  async uploadFileToS3(uploadUrl: string, file: File): Promise<void> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });
    if (!response.ok) {
      throw new Error(`S3 upload failed with status ${response.status}`);
    }
  },

  async confirmUpload(data: ConfirmUploadInput): Promise<{ documentId: string }> {
    const res = await apiClient.post<ApiResponse<{ documentId: string }>>('/api/documents/confirm', data);
    if (!res.data.success || !res.data.data) {
      throw new Error(res.data.message || 'Failed to confirm document upload');
    }
    return res.data.data;
  },

  async deleteDocument(documentId: string): Promise<void> {
    const res = await apiClient.delete<ApiResponse<null>>(`/api/documents/${documentId}`);
    if (!res.data.success) {
      throw new Error(res.data.message || 'Failed to delete document');
    }
  },
};
