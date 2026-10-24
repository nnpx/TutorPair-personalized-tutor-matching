import { Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { successResponse } from '../../common/utils/response.util.js';
import { AuthRequest } from '../../common/middlewares/authenticate-jwt.js';
import { studentsService } from './students.service.js';

export const studentsController = {
  getProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const profile = await studentsService.getProfile(userId);
    res.status(200).json(successResponse(profile));
  }),

  createProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const profile = await studentsService.createProfile(userId, req.body);
    res.status(201).json(successResponse(profile, 'Student profile created successfully'));
  }),

  updateProfile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const profile = await studentsService.updateProfile(userId, req.body);
    res.status(200).json(successResponse(profile, 'Student profile updated successfully'));
  }),

  getAvailability: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const availability = await studentsService.getAvailability(userId);
    res.status(200).json(successResponse(availability));
  }),

  setAvailability: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const availability = await studentsService.setAvailability(userId, req.body);
    res.status(200).json(successResponse(availability, 'Availability schedule updated successfully'));
  }),

  getSubjects: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const subjects = await studentsService.getSubjects(userId);
    res.status(200).json(successResponse(subjects));
  }),

  setSubjects: asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.id;
    const subjects = await studentsService.setSubjects(userId, req.body.variant_ids);
    res.status(200).json(successResponse(subjects, 'Student target subjects updated successfully'));
  }),
};
