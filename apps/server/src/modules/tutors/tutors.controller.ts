import { Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { successResponse } from '../../common/utils/response.util.js';
import { AuthRequest } from '../../common/middlewares/authenticate-jwt.js';
import { tutorsService } from './tutors.service.js';

export const tutorsController = {
  getProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const profile = await tutorsService.getProfile(userId);
    res.status(200).json(successResponse(profile));
  }),

  createProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const profile = await tutorsService.createProfile(userId, req.body);
    res.status(201).json(successResponse(profile, 'Tutor profile created successfully'));
  }),

  updateProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const profile = await tutorsService.updateProfile(userId, req.body);
    res.status(200).json(successResponse(profile, 'Tutor profile updated successfully'));
  }),

  getSubjects: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const data = await tutorsService.getSubjects(userId);
    res.status(200).json(successResponse(data));
  }),

  setSubjects: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const data = await tutorsService.setSubjects(userId, req.body);
    res.status(200).json(successResponse(data, 'Tutor subjects updated successfully'));
  }),

  getAvailability: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const data = await tutorsService.getAvailability(userId);
    res.status(200).json(successResponse(data));
  }),

  setAvailability: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const data = await tutorsService.setAvailability(userId, req.body);
    res.status(200).json(successResponse(data, 'Availability schedule updated successfully'));
  }),

  getVerification: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const data = await tutorsService.getVerification(userId);
    res.status(200).json(successResponse(data));
  }),
};
