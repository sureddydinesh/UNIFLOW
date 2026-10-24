/**
 * Sanitizes backend/authentication error messages to prevent leakage of
 * sensitive JWT tokens, API keys, endpoints, or internal database schemas.
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
  // If database error with internal PostgreSQL details or syntax
  if (
    sanitized.toLowerCase().includes('relation') ||
    sanitized.toLowerCase().includes('syntax error') ||
    sanitized.toLowerCase().includes('pg_') ||
    sanitized.toLowerCase().includes('column') ||
    sanitized.toLowerCase().includes('database error')
  ) {
    return 'Database connection or query error. Please check your network and try again.';
  }
  return sanitized;
}
