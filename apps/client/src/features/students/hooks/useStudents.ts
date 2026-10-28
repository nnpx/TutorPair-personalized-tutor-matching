import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentsApi } from '../students.api';
import { useAuthStore } from '../../../store/auth.store';
import type {
  StudentProfileInput,
  UpdateStudentProfileInput,
  SetStudentAvailabilityInput,
  SubjectCategory,
} from '@tutorpair/shared';

export const STUDENT_QUERY_KEYS = {
  profile: (userId?: string) => ['students', userId || 'me', 'profile'] as const,
  availability: (userId?: string) => ['students', userId || 'me', 'availability'] as const,
  subjects: (userId?: string) => ['students', userId || 'me', 'subjects'] as const,
  catalog: (category?: SubjectCategory) => ['subjects', 'catalog', category ?? 'ALL'] as const,
};

// 1. Profile & Preferences Hooks (TP-58, TP-57, TP-54)
export function useStudentProfile() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.profile(user?.id),
    queryFn: studentsApi.getProfile,
    enabled: Boolean(user?.id),
    retry: false,
    staleTime: 0,
  });
}

export function useCreateStudentProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: (data: StudentProfileInput) => studentsApi.createProfile(data),
    onSuccess: (data) => {
      queryClient.setQueryData(STUDENT_QUERY_KEYS.profile(user?.id), data);
      queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.profile(user?.id) });
    },
  });
}

export function useUpdateStudentProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: (data: UpdateStudentProfileInput) => studentsApi.updateProfile(data),
    onSuccess: (data) => {
      queryClient.setQueryData(STUDENT_QUERY_KEYS.profile(user?.id), data);
      queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.profile(user?.id) });
    },
  });
}

// 2. Weekly Availability Schedule Hooks (TP-54)
export function useStudentAvailability() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.availability(user?.id),
    queryFn: studentsApi.getAvailability,
    enabled: Boolean(user?.id),
    retry: false,
    staleTime: 0,
  });
}

export function useSetStudentAvailability() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: (data: SetStudentAvailabilityInput) => studentsApi.setAvailability(data),
    onSuccess: (data) => {
      queryClient.setQueryData(STUDENT_QUERY_KEYS.availability(user?.id), data);
      queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.availability(user?.id) });
    },
  });
}

// 3. Target Subject Requirements Hooks
export function useStudentSubjects() {
  const { user } = useAuthStore();
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.subjects(user?.id),
    queryFn: studentsApi.getSubjects,
    enabled: Boolean(user?.id),
    retry: false,
  });
}

export function useSetStudentSubjects() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  return useMutation({
    mutationFn: (variantIds: string[]) => studentsApi.setSubjects(variantIds),
    onSuccess: (data) => {
      queryClient.setQueryData(STUDENT_QUERY_KEYS.subjects(user?.id), data);
      queryClient.invalidateQueries({ queryKey: STUDENT_QUERY_KEYS.subjects(user?.id) });
    },
  });
}

// 4. Subjects Reference Catalog Hook
export function useSubjectsCatalog(category?: SubjectCategory) {
  return useQuery({
    queryKey: STUDENT_QUERY_KEYS.catalog(category),
    queryFn: () => studentsApi.getSubjectsCatalog(category),
    staleTime: 1000 * 60 * 15, // 15 mins cache
  });
}
