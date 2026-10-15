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
  AWS_REGION: z.string().default('ap-southeast-1'),
  COGNITO_USER_POOL_ID: z.string().default('ap-southeast-1_mockpool'),
  COGNITO_CLIENT_ID: z.string().default('mockclientid123456789'),
  S3_BUCKET_NAME: z.string().default('tutorpair-documents-dev'),
  SES_FROM_EMAIL: z.string().email().default('notifications@tutorpair.com'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid or missing environment variables:');
  console.error(JSON.stringify(parsedEnv.error.format(), null, 2));
  process.exit(1);
}

export const env = parsedEnv.data;
