/**
 * Determine the cookie domain based on environment.
 *
 * COOKIE_DOMAIN (e.g. ".comp.example.com") overrides the built-in trycomp.ai
 * detection so self-hosted deployments can share one session across their own
 * app, portal and api subdomains.
 */
export function getCookieDomain(): string | undefined {
  const override = process.env.COOKIE_DOMAIN?.trim();
  if (override) {
    return override.startsWith('.') ? override : `.${override}`;
  }

  const baseUrl = process.env.BASE_URL || '';

  if (baseUrl.includes('staging.trycomp.ai')) {
    return '.staging.trycomp.ai';
  }
  if (baseUrl.includes('trycomp.ai')) {
    return '.trycomp.ai';
  }
  return undefined;
}
