import { renderSelectionEmail } from './selection-email.js';
export function renderNotificationEmail(event: string, message: string, portalUrl: string) {
  const selected = renderSelectionEmail(portalUrl);
  if (event === 'TUTOR_SELECTED') return selected;
  const title = event === 'VERIFICATION_APPROVED' ? 'Your TutorPair application is approved' :
    event === 'VERIFICATION_REJECTED' ? 'An update on your TutorPair application' : null;
  if (!title) throw new Error('Unsupported email event');
  const escaped = message.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  return { subject: title,
    text: `Hi there,\n\n${message}\n\nOpen Tutor Portal: ${portalUrl}\n\nBest,\nThe TutorPair Team`,
    html: selected.html.replace(/A student has selected you as their tutor/g, title)
      .replace('A student has selected you on TutorPair', title)
      .replace('Good news — a student has confirmed you as their tutor on TutorPair.', escaped)
      .replace('Good news — a student has confirmed you as their tutor. Check your Tutor Portal.', 'An update on your tutor application. Check your Tutor Portal.')
      .replace('A new connection', 'Application update') };
}
