import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { successResponse } from '../../common/utils/response.util.js';
import { subjectsService } from './subjects.service.js';
import { SubjectQueryInput } from '@tutorpair/shared';

export const subjectsController = {
  getSubjects: asyncHandler(async (req: Request, res: Response) => {
    const { category } = req.query as unknown as SubjectQueryInput;
    const subjects = await subjectsService.getSubjects(category);
    res.status(200).json(successResponse(subjects));
  }),
};
