/**
 * NOTE: This is an initial draft / baseline implementation.
 * It should be reviewed, tested, and revised when integrating S3 presigned URLs with AWS S3.
 */
import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../../config/aws-clients.js';
import { env } from '../../config/env.js';

export async function generateUploadPresignedUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 600 // 10 minutes
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

export async function generateViewPresignedUrl(
  key: string,
  expiresInSeconds = 900 // 15 minutes
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}
