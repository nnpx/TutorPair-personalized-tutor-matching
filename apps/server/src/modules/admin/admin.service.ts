import { adminRepository } from './admin.repository.js';
import { notificationService } from '../../common/notifications/notification.service.js';
import { documentsService } from '../documents/documents.service.js';
import { NotFoundError, BadRequestError } from '../../common/errors/http-errors.js';
import {
  VerificationStatus,
  NotificationEventType,
  VerifyTutorInput,
  AdminTutorListItemDto,
  AdminTutorDetailDto,
} from '@tutorpair/shared';

export const adminService = {
  getTutorsQueue: async (statusFilter?: string): Promise<AdminTutorListItemDto[]> => {
    let filter: VerificationStatus | 'ALL' = 'ALL';
    if (statusFilter) {
      const upper = statusFilter.toUpperCase();
      if (upper === 'ALL') {
        filter = 'ALL';
      } else if (Object.values(VerificationStatus).includes(upper as VerificationStatus)) {
        filter = upper as VerificationStatus;
      }
    }
    return adminRepository.findTutors(filter);
  },

  getTutorDetails: async (tutorId: string): Promise<AdminTutorDetailDto> => {
    const tutor = await adminRepository.findTutorById(tutorId);
    if (!tutor) {
      throw new NotFoundError(`Tutor with id ${tutorId} not found`);
    }
    return tutor;
  },

  getDocumentViewUrl: async (tutorId: string, documentId: string) => {
    const document = await adminRepository.findDocumentById(documentId, tutorId);
    if (!document) {
      throw new NotFoundError(`Document ${documentId} for tutor ${tutorId} not found`);
    }

    // 15-minute expiration as per docs/S3_DOCUMENTS.md
    const viewUrl = await documentsService.generatePresignedViewUrl(document.file_key, 900);

    return {
      document_id: document.id,
      document_type: document.document_type,
      file_key: document.file_key,
      file_size_kb: document.file_size_kb,
      view_url: viewUrl,
      expires_in_seconds: 900,
    };
  },

  verifyTutor: async (tutorId: string, input: VerifyTutorInput) => {
    if (input.status === VerificationStatus.REJECTED && !input.rejection_reason?.trim()) {
      throw new BadRequestError('Rejection reason is required when rejecting a tutor');
    }
    const reason = input.status === VerificationStatus.REJECTED ? input.rejection_reason!.trim() : null;
    return adminRepository.transaction(async tx => {
      const tutor = await adminRepository.lockTutor(tx, tutorId);
      if (!tutor) throw new NotFoundError('Tutor not found');
      // A repeated decision has no side effects. Another status transition is a new event.
      if (tutor.verification_status === input.status) return {
        user_id: tutorId, verification_status: tutor.verification_status, rejection_reason: tutor.rejection_reason,
      };
      const updated = await adminRepository.saveVerification(tx, tutorId, input.status, reason);
      await notificationService.createNotification({
        userId: tutorId,
        eventType: input.status === VerificationStatus.APPROVED ? NotificationEventType.VERIFICATION_APPROVED : NotificationEventType.VERIFICATION_REJECTED,
        message: input.status === VerificationStatus.APPROVED ? 'Your tutor application has been approved.' : `Your tutor application needs changes: ${reason}`,
        requiresEmail: true,
      }, tx);
      return { user_id: tutorId, verification_status: updated.verification_status, rejection_reason: updated.rejection_reason };
    });
  },
};
