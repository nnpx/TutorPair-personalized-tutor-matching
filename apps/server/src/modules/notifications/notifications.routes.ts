import { Router } from 'express';
import { authenticate } from '../../common/middlewares/authenticate-jwt.js';
import { notificationsController } from './notifications.controller.js';

const router = Router();

// All notification endpoints require authenticated user
router.use(authenticate);

router.get('/', notificationsController.getUserNotifications);
router.patch('/:id/read', notificationsController.markAsRead);
router.post('/read-all', notificationsController.markAllAsRead);

export const notificationsRouter = router;
