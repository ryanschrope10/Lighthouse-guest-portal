import { NewBookApiError } from "./newbook/client";

/**
 * Map internal/upstream errors to a calm, guest-safe message for API
 * responses. The real error should still be console.error'd server-side
 * for debugging — this is only what the guest sees.
 */
export function guestFacingError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof NewBookApiError) {
    return "We're having trouble reaching the booking system right now. Please try again in a few minutes.";
  }
  return fallback;
}
