import { getCookieDomain } from './cookie-domain';

describe('getCookieDomain', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.COOKIE_DOMAIN;
    delete process.env.BASE_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns undefined for localhost', () => {
    process.env.BASE_URL = 'http://localhost:3333';
    expect(getCookieDomain()).toBeUndefined();
  });

  it('detects the production trycomp.ai domain', () => {
    process.env.BASE_URL = 'https://api.trycomp.ai';
    expect(getCookieDomain()).toBe('.trycomp.ai');
  });

  it('detects the staging trycomp.ai domain', () => {
    process.env.BASE_URL = 'https://api.staging.trycomp.ai';
    expect(getCookieDomain()).toBe('.staging.trycomp.ai');
  });

  it('returns undefined for an unknown domain without an override', () => {
    process.env.BASE_URL = 'https://api.comp.example.com';
    expect(getCookieDomain()).toBeUndefined();
  });

  it('uses COOKIE_DOMAIN for self-hosted domains', () => {
    process.env.BASE_URL = 'https://api.comp.example.com';
    process.env.COOKIE_DOMAIN = '.comp.example.com';
    expect(getCookieDomain()).toBe('.comp.example.com');
  });

  it('adds the leading dot when COOKIE_DOMAIN omits it', () => {
    process.env.COOKIE_DOMAIN = 'comp.example.com';
    expect(getCookieDomain()).toBe('.comp.example.com');
  });

  it('lets COOKIE_DOMAIN win over the trycomp.ai detection', () => {
    process.env.BASE_URL = 'https://api.trycomp.ai';
    process.env.COOKIE_DOMAIN = '.comp.example.com';
    expect(getCookieDomain()).toBe('.comp.example.com');
  });

  it('ignores a blank COOKIE_DOMAIN', () => {
    process.env.BASE_URL = 'http://localhost:3333';
    process.env.COOKIE_DOMAIN = '   ';
    expect(getCookieDomain()).toBeUndefined();
  });
});
