import express, { Express } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { errorHandler } from './common/errors/error-handler.js';
import { NotFoundError } from './common/errors/http-errors.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { usersRouter } from './modules/users/users.routes.js';
import { studentsRouter } from './modules/students/students.routes.js';
import { tutorsRouter } from './modules/tutors/tutors.routes.js';
import { subjectsRouter } from './modules/subjects/subjects.routes.js';
import { documentsRouter } from './modules/documents/documents.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { matchingRouter } from './modules/matching/matching.routes.js';
import { reviewsRouter } from './modules/reviews/reviews.routes.js';

export function createApp(): Express {
  const app = express();

  // Development Request Logger
  if (env.NODE_ENV === 'development') {
    app.use((req, _res, next) => {
      console.log(`[HTTP] ${req.method} ${req.url}`);
      next();
    });
  }

  // CORS Configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow same-origin, dev tools, or allowed origins
        if (!origin || env.NODE_ENV === 'development' || origin === env.ALLOWED_ORIGIN) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Mock-Email', 'x-mock-email'],
    })
  );

  // Body parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint (used by ECS ALB / target group)
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Feature Module Routers
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/students', studentsRouter);
  app.use('/api/tutors', tutorsRouter);
  app.use('/api/subjects', subjectsRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/matching', matchingRouter);
  app.use('/api/reviews', reviewsRouter);

  // 404 Handler for undefined API routes (JSON envelope instead of Express's HTML page)
  app.use((_req, _res, next) => {
    next(new NotFoundError('API endpoint not found'));
  });

  // Global Error Handler (must be last)
  app.use(errorHandler);

  return app;
}
