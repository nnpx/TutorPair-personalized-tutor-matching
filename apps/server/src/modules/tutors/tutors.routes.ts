import { Router } from 'express';
import { UserRole } from '@tutorpair/shared';
import {
  TutorProfileSchema,
  UpdateTutorProfileSchema,
  SetTutorSubjectsSchema,
  SetTutorAvailabilitySchema,
} from '@tutorpair/shared';
import { authenticate } from '../../common/middlewares/authenticate-jwt.js';
import { requireRole } from '../../common/middlewares/require-role.js';
import { validateRequest } from '../../common/middlewares/validate-request.js';
import { tutorsController } from './tutors.controller.js';

const router = Router();

// All tutor endpoints require authentication and TUTOR role
router.use(authenticate);
router.use(requireRole([UserRole.TUTOR]));

// 1. Personal Profile
router.get('/profile', tutorsController.getProfile);
router.post('/profile', validateRequest(TutorProfileSchema), tutorsController.createProfile);
router.patch('/profile', validateRequest(UpdateTutorProfileSchema), tutorsController.updateProfile);

// 2. Subjects
router.get('/subjects', tutorsController.getSubjects);
router.put('/subjects', validateRequest(SetTutorSubjectsSchema), tutorsController.setSubjects);

// 3. Availability
router.get('/availability', tutorsController.getAvailability);
router.put('/availability', validateRequest(SetTutorAvailabilitySchema), tutorsController.setAvailability);

// 4. Verification Status
router.get('/verification', tutorsController.getVerification);

export const tutorsRouter = router;
