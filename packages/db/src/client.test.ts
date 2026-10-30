import { describe, it, expect } from 'bun:test';
import { resolveSslConfig } from './ssl-config';

describe('resolveSslConfig', () => {
  it('returns undefined for localhost', () => {
    expect(resolveSslConfig('postgresql://u:p@localhost:5432/x', {})).toBeUndefined();
  });

  it('returns undefined for 127.0.0.1', () => {
    expect(resolveSslConfig('postgresql://u:p@127.0.0.1:5432/x', {})).toBeUndefined();
  });

  it('returns undefined for ::1', () => {
    expect(resolveSslConfig('postgresql://u:p@[::1]:5432/x', {})).toBeUndefined();
  });

  it('returns rejectUnauthorized:false when PRISMA_ALLOW_INSECURE_TLS=1', () => {
    expect(
      resolveSslConfig('postgresql://u:p@db.prod.example.com:5432/x', {
        PRISMA_ALLOW_INSECURE_TLS: '1',
      }),
    ).toEqual({ rejectUnauthorized: false });
  });

  it('returns checkServerIdentity-noop for remote URLs (verified TLS via Node defaults)', () => {
    const result = resolveSslConfig('postgresql://u:p@db.prod.example.com:5432/x', {});
    expect(result).toBeDefined();
    expect(typeof (result as { checkServerIdentity: unknown }).checkServerIdentity).toBe('function');
    expect((result as { checkServerIdentity: () => undefined }).checkServerIdentity()).toBeUndefined();
  });

  it('treats malformed URLs as remote (defensive)', () => {
    const result = resolveSslConfig('not-a-valid-url', {});
    expect(result).toBeDefined();
    expect(typeof (result as { checkServerIdentity: unknown }).checkServerIdentity).toBe('function');
  });
});

describe('resolveSslConfig with DATABASE_SSL_CA', () => {
  const extraCa = '-----BEGIN CERTIFICATE-----\nMIIBextra\n-----END CERTIFICATE-----';
  const remoteUrl = 'postgresql://u:p@db.prod.example.com:5432/x';

  it('adds the extra CA alongside Node root certificates', () => {
    const result = resolveSslConfig(remoteUrl, { DATABASE_SSL_CA: extraCa });
    const ca = (result as { ca: string[] }).ca;
    expect(ca[ca.length - 1]).toBe(extraCa);
    expect(ca.length).toBeGreaterThan(1);
  });

  it('accepts literal \\n sequences so the PEM fits on one line', () => {
    const result = resolveSslConfig(remoteUrl, {
      DATABASE_SSL_CA: extraCa.replace(/\n/g, '\\n'),
    });
    const ca = (result as { ca: string[] }).ca;
    expect(ca[ca.length - 1]).toBe(extraCa);
  });

  it('keeps hostname checking off, as for other remote URLs', () => {
    const result = resolveSslConfig(remoteUrl, { DATABASE_SSL_CA: extraCa });
    expect((result as { checkServerIdentity: () => undefined }).checkServerIdentity()).toBeUndefined();
  });

  it('ignores a value that is not a PEM certificate', () => {
    const result = resolveSslConfig(remoteUrl, { DATABASE_SSL_CA: 'not a certificate' });
    expect(result).not.toHaveProperty('ca');
  });

  it('still returns undefined for localhost', () => {
    expect(
      resolveSslConfig('postgresql://u:p@localhost:5432/x', { DATABASE_SSL_CA: extraCa }),
    ).toBeUndefined();
  });

  it('lets PRISMA_ALLOW_INSECURE_TLS=1 take precedence', () => {
    expect(
      resolveSslConfig(remoteUrl, { DATABASE_SSL_CA: extraCa, PRISMA_ALLOW_INSECURE_TLS: '1' }),
    ).toEqual({ rejectUnauthorized: false });
  });
});
