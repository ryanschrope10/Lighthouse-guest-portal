// ============================================================
// Newbook PMS API Client
// ============================================================
//
// The real Newbook API (verified against a live property):
//  - HTTP Basic Auth (support-issued username + password)
//  - POST only; the "action" is the URL path segment
//  - JSON body always carries `region` and (except for the
//    `api_keys` action) the per-property `api_key`
//  - `success` comes back as the STRING "true"/"false"; failures
//    arrive as HTTP 200/401/412 with success:"false" + `message`
// ============================================================

import { getNewBookCredentials, type PropertyKey } from './config';
import type { NewBookEnvelope } from './types';

export class NewBookApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'NewBookApiError';
  }
}

export class NewBookClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly region: string;
  private readonly apiKey: string;

  constructor(opts: {
    baseUrl: string;
    username: string;
    password: string;
    region: string;
    apiKey: string;
  }) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '');
    this.authHeader =
      'Basic ' +
      Buffer.from(`${opts.username}:${opts.password}`).toString('base64');
    this.region = opts.region;
    this.apiKey = opts.apiKey;
  }

  /**
   * POST to `${baseUrl}/${action}` with `{ region, api_key, ...params }`.
   * Returns the parsed `data` payload, or throws NewBookApiError when
   * `success !== "true"` (Newbook reports failures in the body).
   *
   * `includeApiKey: false` is only for the `api_keys` bootstrap action.
   */
  async request<T>(
    action: string,
    params: Record<string, unknown> = {},
    opts: { includeApiKey?: boolean } = {}
  ): Promise<T> {
    const body: Record<string, unknown> = { region: this.region, ...params };
    if (opts.includeApiKey !== false) {
      body.api_key = this.apiKey;
    }

    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: this.authHeader,
        },
        body: JSON.stringify(body),
        cache: 'no-store',
      });
    } catch (error) {
      throw new NewBookApiError(
        `Failed to reach Newbook: ${
          error instanceof Error ? error.message : 'network error'
        }`,
        0
      );
    }

    const raw = await response.text();
    let envelope: NewBookEnvelope<T>;
    try {
      envelope = JSON.parse(raw) as NewBookEnvelope<T>;
    } catch {
      throw new NewBookApiError(
        `Newbook returned non-JSON (HTTP ${response.status})`,
        response.status,
        raw.slice(0, 500)
      );
    }

    // `success` is the string "true"/"false" — never trust HTTP status alone.
    if (envelope.success !== 'true') {
      throw new NewBookApiError(
        envelope.message || `Newbook "${action}" failed`,
        response.status,
        envelope
      );
    }

    return envelope.data;
  }
}

/** Build a client for a specific property (defaults to NEWBOOK_DEFAULT_PROPERTY). */
export function createNewBookClient(property?: PropertyKey): NewBookClient {
  return new NewBookClient(getNewBookCredentials(property));
}
