import { Router } from 'express';
import { subjectsController } from './subjects.controller.js';

const router = Router();

// GET /api/subjects (optionally ?category=...)
router.get('/', subjectsController.getSubjects);

export const subjectsRouter = router;

