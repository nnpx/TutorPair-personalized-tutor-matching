import { SendEmailCommand } from '@aws-sdk/client-ses';
import { z } from 'zod';
import { renderNotificationEmail } from './email-template.js';
import { EmailSendError } from './email-errors.js';
import type { EmailTransport } from '../../workers/email-dispatch.worker.js';
export type SesSend = (command: SendEmailCommand, options: { abortSignal: AbortSignal }) => Promise<{ MessageId?: string }>;
const permanent = new Set([
  'MessageRejected', 'MailFromDomainNotVerifiedException', 'ConfigurationSetDoesNotExistException',
  'ConfigurationSetSendingPausedException', 'AccountSendingPausedException', 'AccessDenied',
  'AccessDeniedException', 'InvalidClientTokenId', 'SignatureDoesNotMatch', 'UnrecognizedClientException',
  'InvalidParameterValue', 'ValidationError', 'ValidationException',
]);
export function validateSesSettings(from: string, portalUrl: string) {
  if (!z.string().email().safeParse(from).success) throw new Error('SES requires a valid verified sender address');
  const url = new URL(portalUrl);
  if (url.protocol !== 'https:' || url.username || url.password || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('SES requires an HTTPS Tutor Portal URL, not localhost');
  }
}
/** The SDK client is injected: tests never resolve AWS credentials or contact SES. */
export function createSesEmailTransport(send: SesSend, settings: { from: string; portalUrl: string }): EmailTransport {
  validateSesSettings(settings.from, settings.portalUrl);
  return async (job, signal) => {
    if (!z.string().email().safeParse(job.email).success) throw new EmailSendError('INVALID_RECIPIENT', false);
    let email: ReturnType<typeof renderNotificationEmail>;
    try { email = renderNotificationEmail(job.event_type, job.message, settings.portalUrl); }
    catch { throw new EmailSendError('INVALID_EMAIL_TEMPLATE', false); }
    try {
      const result = await send(new SendEmailCommand({
        Source: settings.from,
        Destination: { ToAddresses: [job.email] },
        Message: {
          Subject: { Charset: 'UTF-8', Data: email.subject },
          Body: { Html: { Charset: 'UTF-8', Data: email.html }, Text: { Charset: 'UTF-8', Data: email.text } },
        },
      }), { abortSignal: signal });
      // Acceptance by SES is not a guarantee of inbox delivery. Missing acknowledgement is ambiguous.
      if (!result.MessageId?.trim()) throw new EmailSendError('SES_MISSING_ACKNOWLEDGEMENT', true);
    } catch (error) {
      if (error instanceof EmailSendError) throw error;
      const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
      throw new EmailSendError(permanent.has(name) ? 'SES_PERMANENT_FAILURE' : 'SES_TEMPORARY_FAILURE', !permanent.has(name));
    }
  };
}
