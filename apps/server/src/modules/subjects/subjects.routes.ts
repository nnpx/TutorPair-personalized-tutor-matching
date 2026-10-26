import { Router } from 'express';
import { subjectsController } from './subjects.controller.js';
import { validateRequest } from '../../common/middlewares/validate-request.js';
import { SubjectQuerySchema } from '@tutorpair/shared';

const router = Router();

// GET /api/subjects (optionally ?category=GENERAL_LEARNING|LANGUAGE_TESTING|UNIVERSITY_ENTRANCE)
router.get('/', validateRequest(SubjectQuerySchema, 'query'), subjectsController.getSubjects);

export const subjectsRouter = router;
