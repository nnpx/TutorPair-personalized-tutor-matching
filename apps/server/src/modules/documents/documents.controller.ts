import type { Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { successResponse } from '../../common/utils/response.util.js';
import { AuthRequest } from '../../common/middlewares/authenticate-jwt.js';
import { documentsService } from './documents.service.js';
import type { PresignedUploadRequestInput, ConfirmUploadInput } from '@tutorpair/shared';

export const documentsController = {
  requestUpload: asyncHandler(async (req: AuthRequest, res: Response) => {
    const tutorId = req.user!.id;
    const input = req.body as PresignedUploadRequestInput;
    const result = await documentsService.generatePresignedUploadUrl(tutorId, input);
    res.status(200).json(successResponse(result, 'Presigned upload URL generated successfully'));
  }),

  confirmUpload: asyncHandler(async (req: AuthRequest, res: Response) => {
    const tutorId = req.user!.id;
    const input = req.body as ConfirmUploadInput;
    const result = await documentsService.confirmUpload(tutorId, input);
    res.status(201).json(successResponse(result, 'Document confirmed and saved'));
  }),

  deleteDocument: asyncHandler(async (req: AuthRequest, res: Response) => {
    const tutorId = req.user!.id;
    const documentId = req.params.id;
    await documentsService.deleteDocument(tutorId, documentId);
    res.status(200).json(successResponse(null, 'Document deleted successfully'));
  }),
};
