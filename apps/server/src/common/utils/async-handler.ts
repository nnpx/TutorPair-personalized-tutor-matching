import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async Express route handler or controller method to catch
 * unhandled promise rejections and forward them to the global error handler.
 *
 * Eliminates the need for manual try/catch blocks in every controller.
 *
 * Sample Usage:
 * export const getProfile = asyncHandler(async (req, res) => {
 *   const profile = await studentsService.getProfile(req.user.id);
 *   res.status(200).json(successResponse(profile));
 * });
 */
export const asyncHandler = <Req extends Request = Request>(
  fn: (req: Req, res: Response, next: NextFunction) => Promise<unknown> | unknown
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as Req, res, next)).catch((err) => next(err));
  };
};
