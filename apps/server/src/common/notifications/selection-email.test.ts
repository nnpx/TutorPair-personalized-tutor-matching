import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderSelectionEmail } from './selection-email.js';
test('selection email includes a portal link and plain text without student private information', () => {
  const email = renderSelectionEmail('http://localhost:5180/tutor/profile');
  assert.ok(email.text.includes('Hi there,\n\n'));
  assert.ok(!email.text.includes('\\n'));
  assert.match(email.subject, /selected you/);
  assert.match(email.text, /http:\/\/localhost:5180\/tutor\/profile/);
  assert.match(email.html, /Open Tutor Portal/);
});
test('email escapes links and refuses executable URLs or credentials', () => {
  assert.match(renderSelectionEmail('http://localhost:5180/?a=1&b=2').html, /&amp;b=2/);
  assert.throws(() => renderSelectionEmail('javascript:alert(1)'));
  assert.throws(() => renderSelectionEmail('https://name:secret@example.com'));
});
