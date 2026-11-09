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
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  RDS_CA_BUNDLE: z.string().optional(),
  EMAIL_MODE: z.enum(['disabled', 'preview', 'ses']).default('disabled'),
  EMAIL_PREVIEW_DIR: z.string().default('work/email-preview'),
  TUTOR_PORTAL_URL: z.string().url().default('http://localhost:5173/tutor/profile'),
  AWS_REGION: z.string().default('ap-southeast-1'),
  COGNITO_USER_POOL_ID: z.string().default('ap-southeast-1_mockpool'),
  COGNITO_CLIENT_ID: z.string().default('mockclientid123456789'),
  S3_BUCKET_NAME: z.string().default('tutorpair-documents-dev'),
  SES_FROM_EMAIL: z.string().email().default('notifications@tutorpair.com'),
}).superRefine((config, context) => {
  if (config.NODE_ENV === 'production') {
    const dbUrl = new URL(config.DATABASE_URL);
    const originUrl = new URL(config.ALLOWED_ORIGIN);
    if (['localhost', '127.0.0.1', '[::1]'].includes(dbUrl.hostname)) {
      context.addIssue({ code: 'custom', path: ['DATABASE_URL'], message: 'Production DATABASE_URL must not point to localhost' });
    }
    if (['localhost', '127.0.0.1', '[::1]'].includes(originUrl.hostname) || /mock/i.test(config.ALLOWED_ORIGIN)) {
      context.addIssue({ code: 'custom', path: ['ALLOWED_ORIGIN'], message: 'Production ALLOWED_ORIGIN must be a real HTTPS application origin' });
    }
    if (!config.ALLOWED_ORIGIN.startsWith('https://')) {
      context.addIssue({ code: 'custom', path: ['ALLOWED_ORIGIN'], message: 'Production ALLOWED_ORIGIN must use HTTPS' });
    }
    const portalUrl = new URL(config.TUTOR_PORTAL_URL);
    if (portalUrl.protocol !== 'https:' || portalUrl.username || portalUrl.password ||
        ['localhost', '127.0.0.1', '[::1]'].includes(portalUrl.hostname) || /mock/i.test(config.TUTOR_PORTAL_URL)) {
      context.addIssue({ code: 'custom', path: ['TUTOR_PORTAL_URL'], message: 'Production TUTOR_PORTAL_URL must be a public HTTPS URL' });
    }
    if (config.EMAIL_MODE === 'preview') {
      context.addIssue({ code: 'custom', path: ['EMAIL_MODE'], message: 'Local email preview mode cannot be used in production' });
    }
    if (config.EMAIL_MODE !== 'ses') {
      context.addIssue({ code: 'custom', path: ['EMAIL_MODE'], message: 'Production requires SES email delivery to be explicitly enabled' });
    }
    if (!config.RDS_CA_BUNDLE) {
      context.addIssue({ code: 'custom', path: ['RDS_CA_BUNDLE'], message: 'Production requires the RDS CA bundle path for verified TLS' });
    }
    for (const key of ['AWS_REGION', 'COGNITO_USER_POOL_ID', 'COGNITO_CLIENT_ID', 'S3_BUCKET_NAME'] as const) {
      const value = config[key];
      if (!process.env[key] || /mock|example|changeme|placeholder|x{6,}/i.test(value)) {
        context.addIssue({ code: 'custom', path: [key], message: `Production requires a real ${key}` });
      }
    }
    if (!process.env.SES_FROM_EMAIL || /example|changeme|placeholder/i.test(config.SES_FROM_EMAIL)) {
      context.addIssue({ code: 'custom', path: ['SES_FROM_EMAIL'], message: 'Production requires a verified SES_FROM_EMAIL' });
    }
  }
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
