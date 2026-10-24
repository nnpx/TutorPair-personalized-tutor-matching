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
    const tutor = await adminRepository.findTutorById(tutorId);
    if (!tutor) {
      throw new NotFoundError(`Tutor with id ${tutorId} not found`);
    }

    if (input.status === VerificationStatus.REJECTED && !input.rejection_reason?.trim()) {
      throw new BadRequestError('Rejection reason is required when rejecting a tutor');
    }

    const rejectionReason =
      input.status === VerificationStatus.REJECTED ? input.rejection_reason!.trim() : null;

    const updated = await adminRepository.updateVerificationStatus(
      tutorId,
      input.status,
      rejectionReason
    );

    // Create In-App Notification and queue email for SES background worker
    try {
      if (input.status === VerificationStatus.APPROVED) {
        await notificationService.createNotification({
          userId: tutorId,
          eventType: NotificationEventType.VERIFICATION_APPROVED,
          message: 'Congratulations! Your tutor profile and credentials have been verified and approved.',
          requiresEmail: true,
        });
      } else if (input.status === VerificationStatus.REJECTED) {
        await notificationService.createNotification({
          userId: tutorId,
          eventType: NotificationEventType.VERIFICATION_REJECTED,
          message: `Your tutor verification application was rejected: ${rejectionReason}`,
          requiresEmail: true,
        });
      }
    } catch (notifErr) {
      console.warn('Notification creation skipped in development:', notifErr);
    }

    return {
      user_id: tutorId,
      verification_status: updated.verification_status,
      rejection_reason: updated.rejection_reason,
    };
  },
};
