import { Request, Response } from 'express';
import { asyncHandler } from '../../common/utils/async-handler.js';
import { successResponse } from '../../common/utils/response.util.js';
import { AuthRequest } from '../../common/middlewares/authenticate-jwt.js';
import { reviewsService } from './reviews.service.js';

export const reviewsController = {
  submitReview: asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await reviewsService.submitReview(req.user!.id, req.body);
    res.status(201).json(successResponse(result, 'Review submitted successfully'));
  }),

  getTutorReviews: asyncHandler(async (req: Request, res: Response) => {
    const summary = await reviewsService.getTutorReviews(req.params.tutorId);
    res.status(200).json(successResponse(summary));
  }),

  getRecommendationContext: asyncHandler(async (req: AuthRequest, res: Response) => {
    const details = await reviewsService.getRecommendationContext(
      req.user!.id,
      req.params.recommendationId
    );
    res.status(200).json(successResponse(details));
  }),
};
