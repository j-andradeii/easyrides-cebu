/**
 * Reads a react-hook-form error message for a possibly nested field path
 * ("pricing.sedan.price", "itinerary.0.activity").
 *
 * The Form* components each grew their own copy of this walk; new ones share
 * this instead.
 */

export function getNestedError(
  errors: Record<string, unknown>,
  path: string
): string | undefined {
  const parts = path.split('.');
  let current: Record<string, unknown> = errors;

  for (const part of parts) {
    if (!current?.[part]) return undefined;
    current = current[part] as Record<string, unknown>;
  }

  return typeof current?.message === 'string' ? current.message : undefined;
}
