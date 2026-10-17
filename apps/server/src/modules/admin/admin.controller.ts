import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { successResponse } from '../../common/utils/response.util.js';
import { adminService } from './admin.service.js';
import { VerifyTutorInput } from '@tutorpair/shared';

export const adminController = {
  getTutorsQueue: asyncHandler(async (req: Request, res: Response) => {
    const status = req.query.status as string | undefined;
    const tutors = await adminService.getTutorsQueue(status);
    res.status(200).json(successResponse(tutors, 'Tutors queue retrieved successfully'));
  }),

  getTutorDetails: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const tutor = await adminService.getTutorDetails(id);
    res.status(200).json(successResponse(tutor, 'Tutor details retrieved successfully'));
  }),

  getDocumentViewUrl: asyncHandler(async (req: Request, res: Response) => {
    const { id, docId } = req.params;
    const docInfo = await adminService.getDocumentViewUrl(id, docId);
    res.status(200).json(successResponse(docInfo, 'Document view URL generated successfully'));
  }),

  verifyTutor: asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await adminService.verifyTutor(id, req.body as VerifyTutorInput);
    const actionText =
      result.verification_status === 'APPROVED' ? 'approved' : 'rejected';
    res.status(200).json(successResponse(result, `Tutor application ${actionText} successfully`));
  }),
};
