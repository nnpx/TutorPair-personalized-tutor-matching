import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { successResponse } from '../../common/utils/response.util.js';
import { subjectsService } from './subjects.service.js';
import { SubjectCategory } from '@tutorpair/shared';

export const subjectsController = {
  getSubjects: asyncHandler(async (req: Request, res: Response) => {
    const categoryQuery = req.query.category as string | undefined;
    const category = categoryQuery && Object.values(SubjectCategory).includes(categoryQuery as SubjectCategory)
      ? (categoryQuery as SubjectCategory)
      : undefined;

    const subjects = await subjectsService.getSubjects(category);
    res.status(200).json(successResponse(subjects));
  }),
};

