/**
 * Sanitizes backend/authentication error messages to prevent leakage of
 * sensitive JWT tokens, API keys, endpoints, or internal database schemas,
 * while providing actionable messages for network, configuration, and auth errors.
 */
export function sanitizeErrorMessage(rawMessage?: string): string {
  if (!rawMessage) return 'An unexpected error occurred while loading your profile data.';
  let sanitized = rawMessage;

  // Strip any JWT tokens (eyJ...)
  sanitized = sanitized.replace(/eyJ[a-zA-Z0-9_\-.]+/g, '[REDACTED_TOKEN]');
  // Strip any Bearer tokens
  sanitized = sanitized.replace(/bearer\s+[a-zA-Z0-9_\-.]+/gi, 'Bearer [REDACTED]');
  // Strip URLs or project endpoints
  sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, '[REDACTED_URL]');

  const lower = sanitized.toLowerCase();

  // Network failures / DNS / unreachable endpoints ("Failed to fetch")
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('err_name_not_resolved') ||
    lower.includes('err_connection_refused') ||
    lower.includes('load failed')
  ) {
    return 'Unable to reach the authentication service. Please check your internet connection or verify that VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are configured in your hosting environment.';
  }

  // Duplicate email / already registered user
  if (
    lower.includes('user already registered') ||
    lower.includes('already exists') ||
    lower.includes('email address already registered')
  ) {
    return 'An account with this email address already exists. Please sign in instead.';
  }

  // Invalid email address
  if (
    lower.includes('email_address_invalid') ||
    lower.includes('invalid email') ||
    (lower.includes('email') && lower.includes('is invalid'))
  ) {
    return 'Please provide a valid university email address.';
  }

  // Database error with internal PostgreSQL details or syntax
  if (
    lower.includes('relation') ||
    lower.includes('syntax error') ||
    lower.includes('pg_') ||
    lower.includes('column') ||
    lower.includes('database error')
  ) {
    return 'Database connection or query error. Please check your network and try again.';
  }

  return sanitized;
}
