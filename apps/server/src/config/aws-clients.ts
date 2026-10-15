import { S3Client } from '@aws-sdk/client-s3';
import { SESClient } from '@aws-sdk/client-ses';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from './env.js';

export const s3Client = new S3Client({
  region: env.AWS_REGION,
});

export const sesClient = new SESClient({
  region: env.AWS_REGION,
});

export const cognitoVerifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  tokenUse: 'id',
  clientId: env.COGNITO_CLIENT_ID,
});
