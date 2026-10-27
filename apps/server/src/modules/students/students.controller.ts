import { Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { successResponse } from '../../common/utils/response.util.js';
import { AuthRequest } from '../../common/middlewares/authenticate-jwt.js';
import { UnauthorizedError, BadRequestError } from '../../common/errors/http-errors.js';
import { studentsService } from './students.service.js';

function getUserId(req: AuthRequest): string {
  const userId = req.user?.id;
  if (!userId) {
    throw new UnauthorizedError('User authentication required');
  }
  return userId;
}

export const studentsController = {
  getProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    const profile = await studentsService.getProfile(userId);
    res.status(200).json(successResponse(profile));
  }),

  createProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    const profile = await studentsService.createProfile(userId, req.body);
    res.status(201).json(successResponse(profile, 'Student profile created successfully'));
  }),

  updateProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    const profile = await studentsService.updateProfile(userId, req.body);
    res.status(200).json(successResponse(profile, 'Student profile updated successfully'));
  }),

  getAvailability: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    const availability = await studentsService.getAvailability(userId);
    res.status(200).json(successResponse(availability));
  }),

  setAvailability: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    const availability = await studentsService.setAvailability(userId, req.body);
    res.status(200).json(successResponse(availability, 'Availability schedule updated successfully'));
  }),

  getSubjects: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    const subjects = await studentsService.getSubjects(userId);
    res.status(200).json(successResponse(subjects));
  }),

  setSubjects: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = getUserId(req);
    const variantIds = req.body?.variant_ids;
    if (!variantIds || !Array.isArray(variantIds)) {
      throw new BadRequestError('variant_ids array is required');
    }
    const subjects = await studentsService.setSubjects(userId, variantIds);
    res.status(200).json(successResponse(subjects, 'Student target subjects updated successfully'));
  }),
};
