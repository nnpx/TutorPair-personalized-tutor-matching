import { z } from 'zod';
import dotenv from 'dotenv';

// Load .env or .env.local if available
dotenv.config({ path: '.env.local' });
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  ALLOWED_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().url().default('postgresql://postgres:postgres@localhost:5432/tutorpair'),
  EMAIL_MODE: z.enum(['disabled', 'preview', 'ses']).default('disabled'),
  EMAIL_PREVIEW_DIR: z.string().default('work/email-preview'),
  TUTOR_PORTAL_URL: z.string().url().default('http://localhost:5180/tutor/profile'),
  AWS_REGION: z.string().default('ap-southeast-1'),
  COGNITO_USER_POOL_ID: z.string().default('ap-southeast-1_mockpool'),
  COGNITO_CLIENT_ID: z.string().default('mockclientid123456789'),
  S3_BUCKET_NAME: z.string().default('tutorpair-documents-dev'),
  SES_FROM_EMAIL: z.string().email().default('notifications@tutorpair.com'),
}).superRefine((config, context) => {
  if (config.EMAIL_MODE !== 'ses') return;
  const url = new URL(config.TUTOR_PORTAL_URL);
  if (url.protocol !== 'https:' || url.username || url.password || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    context.addIssue({ code: 'custom', path: ['TUTOR_PORTAL_URL'], message: 'SES mode requires an HTTPS website URL, not localhost' });
  }
  if (!process.env.SES_FROM_EMAIL) {
    context.addIssue({ code: 'custom', path: ['SES_FROM_EMAIL'], message: 'Explicitly configure a verified SES sender for SES mode' });
  }
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid or missing environment variables:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
