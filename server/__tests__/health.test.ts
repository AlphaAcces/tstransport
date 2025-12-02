import { describe, expect, it } from 'vitest';
import request from 'supertest';

import app from '../app';

describe('Health endpoint', () => {
  it('returns ok status payload without auth', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      service: 'TS24 Intel Console',
      status: 'ok',
    });
    expect(typeof res.body.timestamp).toBe('string');
    expect(typeof res.body.version).toBe('string');
  });
});

describe('SSO Health endpoint', () => {
  it('returns SSO configuration in development mode', async () => {
    const res = await request(app).get('/api/auth/sso-health');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      expectedIss: 'ts24-intel',
      expectedAud: 'ts24-intel',
      usesHS256: true,
      configVersion: 'v1',
    });
    expect(typeof res.body.secretConfigured).toBe('boolean');
    expect(res.body.recentErrors).toBeDefined();
    expect(typeof res.body.recentErrors.invalidSignature).toBe('number');
    expect(typeof res.body.recentErrors.expired).toBe('number');
    expect(typeof res.body.recentErrors.malformed).toBe('number');
    expect(typeof res.body.recentErrors.unknownAgent).toBe('number');
  });

  it('includes all required configuration fields', async () => {
    const res = await request(app).get('/api/auth/sso-health');

    expect(res.status).toBe(200);
    
    // Verify all required fields are present
    const requiredFields = [
      'expectedIss',
      'expectedAud',
      'secretConfigured',
      'usesHS256',
      'configVersion',
      'recentErrors',
    ];

    for (const field of requiredFields) {
      expect(res.body).toHaveProperty(field);
    }

    // Verify error metrics structure
    const errorFields = ['invalidSignature', 'expired', 'malformed', 'unknownAgent'];
    for (const field of errorFields) {
      expect(res.body.recentErrors).toHaveProperty(field);
      expect(typeof res.body.recentErrors[field]).toBe('number');
    }
  });

  it('reports correct algorithm and version', async () => {
    const res = await request(app).get('/api/auth/sso-health');

    expect(res.status).toBe(200);
    expect(res.body.usesHS256).toBe(true);
    expect(res.body.configVersion).toBe('v1');
    expect(res.body.expectedIss).toBe('ts24-intel');
    expect(res.body.expectedAud).toBe('ts24-intel');
  });
});
