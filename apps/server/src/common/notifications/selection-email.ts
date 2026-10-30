/** Pure email rendering. Delivery is deliberately separate and not enabled locally. */
export function renderSelectionEmail(portalUrl: string) {
  const url = new URL(portalUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('Portal URL must be an HTTP(S) URL without credentials');
  }
  const escape = (value: string) => value.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
  return {
    subject: 'A student has selected you as their tutor on TutorPair',
    text: `Hi there,\n\nGood news — a student has confirmed you as their tutor on TutorPair.\n\nYou can visit your Tutor Portal to check your notifications.\n\nOpen Tutor Portal: ${url.href}\n\nThank you for being part of TutorPair. We’re glad to help you connect with students and share what you know.\n\nBest,\nThe TutorPair Team\n\nThis is an automated notification from TutorPair.`,
    html: `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>A student has selected you on TutorPair</title></head>
<body style="margin:0;padding:0;background-color:#f3f4f6;color:#111827;font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Good news — a student has confirmed you as their tutor. Check your Tutor Portal.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;"><tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background-color:#ffffff;border-radius:8px;">
<tr><td style="padding:28px 32px;border-bottom:1px solid #e5e7eb;font-size:24px;font-weight:bold;letter-spacing:-1px;">Tutor<span style="color:#047857;">Pair</span></td></tr>
<tr><td style="padding:32px;font-size:16px;line-height:1.7;">
<p style="margin:0 0 12px;color:#047857;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;">A new connection</p>
<h1 style="margin:0 0 24px;font-size:26px;line-height:1.3;letter-spacing:-0.5px;">A student has selected you as their tutor</h1>
<p style="margin:0 0 18px;">Hi there,</p>
<p style="margin:0 0 18px;">Good news — a student has confirmed you as their tutor on TutorPair.</p>
<p style="margin:0 0 26px;">You can visit your Tutor Portal to check your notifications.</p>
<table role="presentation" cellpadding="0" cellspacing="0"><tr><td bgcolor="#047857" style="border-radius:6px;"><a href="${escape(url.href)}" style="display:inline-block;padding:14px 24px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;border-radius:6px;">Open Tutor Portal</a></td></tr></table>
<p style="margin:28px 0 18px;">Thank you for being part of TutorPair. We’re glad to help you connect with students and share what you know.</p>
<p style="margin:0;">Best,<br><strong>The TutorPair Team</strong></p>
</td></tr>
<tr><td style="padding:22px 32px;border-top:1px solid #e5e7eb;font-size:12px;line-height:1.7;color:#4b5563;">This is an automated notification from TutorPair.<br>If the button doesn’t work, copy and paste this link into your browser:<br><a href="${escape(url.href)}" style="color:#047857;word-break:break-all;">${escape(url.href)}</a></td></tr>
</table></td></tr></table></body></html>`,
  };
}
