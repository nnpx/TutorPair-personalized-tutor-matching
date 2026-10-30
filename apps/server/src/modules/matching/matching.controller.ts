import { Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { successResponse } from '../../common/utils/response.util.js';
import { AuthRequest } from '../../common/middlewares/authenticate-jwt.js';
import { matchingService } from './matching.service.js';

export const matchingController = {
  runMatch: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await matchingService.findTop3(req.user!.id, req.body);
    res.status(200).json(successResponse(result));
  }),

  confirmSelection: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await matchingService.confirmSelection(
      req.user!.id,
      req.params.matchRequestId,
      req.body
    );
    res.status(200).json(successResponse(result, 'Tutor selected successfully'));
  }),
};
