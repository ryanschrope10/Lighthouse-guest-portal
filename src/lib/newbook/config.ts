// ============================================================
// Newbook configuration resolution
// ============================================================
//
// Newbook auth = HTTP Basic (username/password issued by support)
// + a per-property `api_key` (the `instances_` prefix is part of
// the key). Long-term these per-property keys should live on the
// `properties` table; for now they come from env so we can stand
// up the integration one property at a time.
// ============================================================

export interface NewBookCredentials {
  baseUrl: string;
  username: string;
  password: string;
  region: string;
  apiKey: string;
}

/** A portal property slug that maps to a Newbook instance api_key. */
export type PropertyKey = 'holiday';

const PROPERTY_ENV: Record<PropertyKey, string> = {
  holiday: 'NEWBOOK_API_KEY_HOLIDAY',
};

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Newbook is not configured: missing environment variable ${name}. ` +
        'Set it in .env.local (local) or Render env settings (deploys).'
    );
  }
  return value;
}

/** Resolve Basic Auth + region + the api_key for one property. */
export function getNewBookCredentials(
  property: PropertyKey = getDefaultProperty()
): NewBookCredentials {
  const envName = PROPERTY_ENV[property];
  if (!envName) {
    throw new Error(`Unknown Newbook property "${property}"`);
  }

  return {
    baseUrl: process.env.NEWBOOK_API_BASE_URL || 'https://api.newbook.cloud/rest',
    username: required('NEWBOOK_API_USERNAME'),
    password: required('NEWBOOK_API_PASSWORD'),
    region: process.env.NEWBOOK_API_REGION || 'us',
    apiKey: required(envName),
  };
}

export function getDefaultProperty(): PropertyKey {
  return (process.env.NEWBOOK_DEFAULT_PROPERTY as PropertyKey) || 'holiday';
}

/**
 * The fixed Newbook guest whose live data the portal shows. There is
 * no portal-login <-> Newbook-guest mapping yet, so the demo guest is
 * pinned via env and can be swapped to preview any sandbox guest.
 */
export function getDemoGuestId(): string {
  return required('NEWBOOK_DEMO_GUEST_ID');
}
