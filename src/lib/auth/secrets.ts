const DEV_DEFAULT = "thanishka-dev-admin-secret-change-me";

/**
 * Resolve a signing secret. In production, missing or placeholder values throw
 * so sessions cannot silently use the committed demo default.
 */
export function requireAuthSecret(
  value: string | undefined,
  name: string,
): string {
  const secret = value?.trim() || "";
  const isPlaceholder =
    !secret ||
    secret === DEV_DEFAULT ||
    /change-me/i.test(secret);

  if (process.env.NODE_ENV === "production" && isPlaceholder) {
    throw new Error(
      `${name} must be set to a strong random value in production`,
    );
  }

  return secret || DEV_DEFAULT;
}
