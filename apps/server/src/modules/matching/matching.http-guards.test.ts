import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { Server } from 'node:http';
import { createApp } from '../../app.js';

/**
 * Guards that are decided before any database access, so these run without Postgres:
 * authentication header checks, JSON body parsing and size limit, and routing.
 */
describe('Matching endpoints: request guards (no database needed)', () => {
  let server: Server;
  let baseUrl: string;

  const UUID = '3f2b8c1e-5a4d-4e6f-9a7b-1c2d3e4f5a6b';
  const confirmPath = `/api/matching/${UUID}/confirm`;

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address();
        if (address && typeof address === 'object') baseUrl = `http://localhost:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  const send = (method: string, path: string, init: { headers?: Record<string, string>; body?: string } = {}) =>
    fetch(`${baseUrl}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...init.headers },
      body: init.body,
    });

  const expectErrorEnvelope = async (res: Response, status: number) => {
    assert.equal(res.status, status);
    const body = (await res.json()) as { success: boolean; message: string };
    assert.equal(body.success, false);
    assert.equal(typeof body.message, 'string');
    return body;
  };

  for (const [name, path] of [
    ['POST /api/matching', '/api/matching'],
    ['POST /api/matching/:id/confirm', confirmPath],
  ] as const) {
    describe(name, () => {
      it('401 without an Authorization header', async () => {
        const body = await expectErrorEnvelope(await send('POST', path, { body: '{}' }), 401);
        assert.match(body.message, /Authorization/i);
      });

      it('401 for a non-Bearer Authorization scheme', async () => {
        await expectErrorEnvelope(
          await send('POST', path, { headers: { Authorization: 'Basic abc123' }, body: '{}' }),
          401
        );
      });

      it('400 for malformed JSON, with the standard error envelope', async () => {
        const body = await expectErrorEnvelope(
          await send('POST', path, { body: '{"variant_id": ' }),
          400
        );
        assert.match(body.message, /Malformed JSON/i);
      });

      it('413 (not 500) when the body exceeds the size limit', async () => {
        const huge = JSON.stringify({ variant_id: UUID, padding: 'x'.repeat(1_100_000) });
        const body = await expectErrorEnvelope(await send('POST', path, { body: huge }), 413);
        assert.match(body.message, /too large/i);
      });
    });
  }

  it('404 envelope for an unsupported method on /api/matching', async () => {
    await expectErrorEnvelope(await send('GET', '/api/matching'), 404);
  });

  it('404 envelope for an unsupported method on the confirm route', async () => {
    await expectErrorEnvelope(await send('GET', confirmPath), 404);
    await expectErrorEnvelope(await send('PUT', confirmPath, { body: '{}' }), 404);
  });

  it('404 envelope for an unknown sub-path', async () => {
    await expectErrorEnvelope(await send('POST', `/api/matching/${UUID}/cancel`, { body: '{}' }), 404);
  });
});
