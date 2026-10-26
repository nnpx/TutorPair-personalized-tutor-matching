import { Router } from 'express';
import { UserRole } from '@tutorpair/shared';
import {
  StudentProfileSchema,
  UpdateStudentProfileSchema,
  SetStudentAvailabilitySchema,
  SetStudentSubjectsSchema,
} from '@tutorpair/shared';
import { authenticate } from '../../common/middlewares/authenticate-jwt.js';
import { requireRole } from '../../common/middlewares/require-role.js';
import { validateRequest } from '../../common/middlewares/validate-request.js';
import { studentsController } from './students.controller.js';

const router = Router();

// All student endpoints require authentication and STUDENT role
router.use(authenticate);
router.use(requireRole([UserRole.STUDENT]));

// 1. Personal Profile & Preferences (TP-58, TP-57, TP-54)
router.get('/profile', studentsController.getProfile);
router.get('/me/profile', studentsController.getProfile);
router.post('/profile', validateRequest(StudentProfileSchema), studentsController.createProfile);
router.patch('/profile', validateRequest(UpdateStudentProfileSchema), studentsController.updateProfile);
router.patch('/me/profile', validateRequest(UpdateStudentProfileSchema), studentsController.updateProfile);

// 2. Weekly Availability Schedule (TP-54)
router.get('/availability', studentsController.getAvailability);
router.put('/availability', validateRequest(SetStudentAvailabilitySchema), studentsController.setAvailability);

// 3. Target Subject Requirements
router.get('/subjects', studentsController.getSubjects);
router.put('/subjects', validateRequest(SetStudentSubjectsSchema), studentsController.setSubjects);

export const studentsRouter = router;
