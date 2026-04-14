// ============================================================
// NewBook PMS API Client
// ============================================================
//
// HTTP client for communicating with the NewBook Property
// Management System API. This is scaffold code — all methods
// will need real implementation once we have API credentials
// and confirmed endpoint documentation.
// ============================================================

import type { NewBookApiResponse } from './types';

// --- Error Types ---

/** Structured error from the NewBook API client. */
export class NewBookApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly errorCode?: string,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'NewBookApiError';
  }
}

// --- Client Class ---

/**
 * HTTP client for the NewBook PMS API.
 *
 * Handles authentication, request formatting, and error handling
 * for all NewBook API interactions.
 */
export class NewBookClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/+$/, ''); // strip trailing slash
    this.apiKey = apiKey;
  }

  /**
   * Build the standard headers for all NewBook API requests.
   * TODO: Confirm exact header names and auth scheme with NewBook docs.
   * NewBook may use Bearer token, API key header, or Basic auth.
   */
  private getHeaders(): Record<string, string> {
    // TODO: Adjust auth header format based on actual NewBook API requirements
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
      // TODO: NewBook may require additional headers (e.g., X-Instance-Id)
    };
  }

  /**
   * Central request method with error handling.
   *
   * Wraps all HTTP calls to NewBook with consistent error handling,
   * logging, and response parsing.
   *
   * @param method - HTTP method
   * @param path - API path (appended to baseUrl)
   * @param body - Optional request body (will be JSON-serialized)
   * @param params - Optional query parameters
   * @returns Parsed JSON response from NewBook
   */
  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: Record<string, unknown>,
    params?: Record<string, string>
  ): Promise<NewBookApiResponse<T>> {
    const url = new URL(`${this.baseUrl}${path}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value);
      });
    }

    // TODO: Add request logging / telemetry
    // TODO: Add retry logic for transient failures (429, 503)
    // TODO: Add rate limiting to respect NewBook API limits

    try {
      const response = await fetch(url.toString(), {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const errorBody = await response.text();
        let parsedError: { error_message?: string; error_code?: string } = {};
        try {
          parsedError = JSON.parse(errorBody);
        } catch {
          // Response body is not JSON — use raw text in error message
        }

        throw new NewBookApiError(
          parsedError.error_message || `NewBook API error: ${response.status} ${response.statusText}`,
          response.status,
          parsedError.error_code,
          errorBody
        );
      }

      const data: NewBookApiResponse<T> = await response.json();

      // NewBook may return 200 with success: false in the body
      if (!data.success) {
        throw new NewBookApiError(
          data.error_message || 'NewBook API returned an unsuccessful response',
          response.status,
          data.error_code
        );
      }

      return data;
    } catch (error) {
      if (error instanceof NewBookApiError) {
        throw error;
      }

      // Network errors, JSON parse failures, etc.
      throw new NewBookApiError(
        `Failed to communicate with NewBook API: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }
  }

  // --- Public HTTP Methods ---

  /**
   * Perform a GET request against the NewBook API.
   *
   * @param path - API endpoint path (e.g., "/guests/123")
   * @param params - Optional query parameters
   * @returns Typed API response
   */
  async get<T>(path: string, params?: Record<string, string>): Promise<NewBookApiResponse<T>> {
    return this.request<T>('GET', path, undefined, params);
  }

  /**
   * Perform a POST request against the NewBook API.
   *
   * @param path - API endpoint path
   * @param body - Request body
   * @returns Typed API response
   */
  async post<T>(path: string, body: Record<string, unknown>): Promise<NewBookApiResponse<T>> {
    return this.request<T>('POST', path, body);
  }

  /**
   * Perform a PUT request against the NewBook API.
   *
   * @param path - API endpoint path
   * @param body - Request body
   * @returns Typed API response
   */
  async put<T>(path: string, body: Record<string, unknown>): Promise<NewBookApiResponse<T>> {
    return this.request<T>('PUT', path, body);
  }

  /**
   * Perform a DELETE request against the NewBook API.
   *
   * @param path - API endpoint path
   * @returns Typed API response
   */
  async delete<T>(path: string): Promise<NewBookApiResponse<T>> {
    return this.request<T>('DELETE', path);
  }
}

// --- Factory Function ---

/**
 * Create a NewBook API client configured for a specific property.
 *
 * Reads the property's NewBook instance URL and API key from
 * environment variables or database configuration.
 *
 * @param propertyId - The portal property ID to create a client for
 * @returns Configured NewBookClient instance
 *
 * @example
 * ```ts
 * const client = await createNewBookClient('prop_abc123');
 * const guest = await client.get<NewBookGuest>('/guests/456');
 * ```
 */
export async function createNewBookClient(propertyId: string): Promise<NewBookClient> {
  // TODO: Replace with actual property config lookup from database
  // This should query the `properties` table for the property's
  // newbook_instance_url and newbook_api_key fields.
  //
  // Example of what this will look like:
  //
  //   const supabase = await createClient();
  //   const { data: property } = await supabase
  //     .from('properties')
  //     .select('newbook_instance_url, newbook_api_key')
  //     .eq('id', propertyId)
  //     .single();
  //
  //   if (!property?.newbook_instance_url || !property?.newbook_api_key) {
  //     throw new Error(`Property ${propertyId} is not configured for NewBook`);
  //   }

  // Placeholder: read from env vars for now
  const baseUrl = process.env.NEWBOOK_API_BASE_URL;
  const apiKey = process.env.NEWBOOK_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      `NewBook API not configured for property ${propertyId}. ` +
        'Set NEWBOOK_API_BASE_URL and NEWBOOK_API_KEY environment variables, ' +
        'or configure the property in the database.'
    );
  }

  return new NewBookClient(baseUrl, apiKey);
}
