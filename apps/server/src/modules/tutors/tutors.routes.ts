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

// All tutor endpoints require authentication
router.use(authenticate);

// 1. Personal Profile (TUTOR role required)
router.get('/profile', requireRole([UserRole.TUTOR]), tutorsController.getProfile);
router.post('/profile', requireRole([UserRole.TUTOR]), validateRequest(TutorProfileSchema), tutorsController.createProfile);
router.patch('/profile', requireRole([UserRole.TUTOR]), validateRequest(UpdateTutorProfileSchema), tutorsController.updateProfile);

// 2. Subjects (TUTOR role required)
router.get('/subjects', requireRole([UserRole.TUTOR]), tutorsController.getSubjects);
router.put('/subjects', requireRole([UserRole.TUTOR]), validateRequest(SetTutorSubjectsSchema), tutorsController.setSubjects);

// 3. Availability (TUTOR role required)
router.get('/availability', requireRole([UserRole.TUTOR]), tutorsController.getAvailability);
router.put('/availability', requireRole([UserRole.TUTOR]), validateRequest(SetTutorAvailabilitySchema), tutorsController.setAvailability);

// 4. Verification Status (TUTOR role required)
router.get('/verification', requireRole([UserRole.TUTOR]), tutorsController.getVerification);

// 5. Matched Students & Confirmed Bookings (TUTOR role required)
router.get('/matched-students', requireRole([UserRole.TUTOR]), tutorsController.getMatchedStudents);

// 6. TP-35: Detailed Tutor Profile (Accessible to authenticated users including students)
router.get('/:tutorId', tutorsController.getPublicTutorDetails);

export const tutorsRouter = router;
