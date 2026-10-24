import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tutorsApi } from '../tutors.api';
import type {
  TutorProfileInput,
  UpdateTutorProfileInput,
  SetTutorSubjectsInput,
  SetTutorAvailabilityInput,
  SubjectCategory,
  DocumentType,
} from '@tutorpair/shared';

export const TUTOR_QUERY_KEYS = {
  profile: ['tutors', 'me', 'profile'] as const,
  subjects: ['tutors', 'me', 'subjects'] as const,
  availability: ['tutors', 'me', 'availability'] as const,
  verification: ['tutors', 'me', 'verification'] as const,
  catalog: (category?: SubjectCategory) => ['subjects', 'catalog', category ?? 'ALL'] as const,
};

// 1. Profile Hooks
export function useTutorProfile() {
  return useQuery({
    queryKey: TUTOR_QUERY_KEYS.profile,
    queryFn: tutorsApi.getProfile,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateTutorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TutorProfileInput) => tutorsApi.createProfile(data),
    onSuccess: (data) => {
      queryClient.setQueryData(TUTOR_QUERY_KEYS.profile, data);
      queryClient.invalidateQueries({ queryKey: TUTOR_QUERY_KEYS.verification });
    },
  });
}

export function useUpdateTutorProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateTutorProfileInput) => tutorsApi.updateProfile(data),
    onSuccess: (data) => {
      queryClient.setQueryData(TUTOR_QUERY_KEYS.profile, data);
    },
  });
}

// 2. Subjects Hooks
export function useTutorSubjects() {
  return useQuery({
    queryKey: TUTOR_QUERY_KEYS.subjects,
    queryFn: tutorsApi.getSubjects,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSetTutorSubjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetTutorSubjectsInput) => tutorsApi.setSubjects(data),
    onSuccess: (data) => {
      queryClient.setQueryData(TUTOR_QUERY_KEYS.subjects, data);
    },
  });
}

// 3. Availability Hooks
export function useTutorAvailability() {
  return useQuery({
    queryKey: TUTOR_QUERY_KEYS.availability,
    queryFn: tutorsApi.getAvailability,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSetTutorAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SetTutorAvailabilityInput) => tutorsApi.setAvailability(data),
    onSuccess: (data) => {
      queryClient.setQueryData(TUTOR_QUERY_KEYS.availability, data);
    },
  });
}

// 4. Verification Hooks
export function useTutorVerification() {
  return useQuery({
    queryKey: TUTOR_QUERY_KEYS.verification,
    queryFn: tutorsApi.getVerification,
    staleTime: 1000 * 60 * 2,
  });
}

// 5. Subjects Reference Catalog Hook
export function useSubjectsCatalog(category?: SubjectCategory) {
  return useQuery({
    queryKey: TUTOR_QUERY_KEYS.catalog(category),
    queryFn: () => tutorsApi.getSubjectsCatalog(category),
    staleTime: 1000 * 60 * 15, // Cache for 15 minutes
  });
}

// 6. S3 Document Upload Workflow Hook
export interface UploadDocumentParams {
  file: File;
  documentType: DocumentType;
  variantId?: string | null;
}

export function useUploadDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, documentType, variantId }: UploadDocumentParams) => {
      const fileSizeKb = Math.ceil(file.size / 1024);
      if (fileSizeKb > 10240) {
        throw new Error('File size exceeds 10MB limit');
      }

      // Step 1: Request presigned PUT URL
      const { uploadUrl, fileKey } = await tutorsApi.requestPresignedUpload({
        file_name: file.name,
        file_size_kb: fileSizeKb,
        document_type: documentType,
        variant_id: variantId,
      });

      // Step 2: Upload raw binary to S3
      await tutorsApi.uploadFileToS3(uploadUrl, file);

      // Step 3: Confirm upload metadata with backend
      return await tutorsApi.confirmUpload({
        file_key: fileKey,
        file_size_kb: fileSizeKb,
        document_type: documentType,
        variant_id: variantId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TUTOR_QUERY_KEYS.verification });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => tutorsApi.deleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TUTOR_QUERY_KEYS.verification });
    },
  });
}
