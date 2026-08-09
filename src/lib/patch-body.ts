/**
 * "Only what the caller actually sent."
 *
 * Every catalogue PATCH schema is its input schema `.partial()`-ed, which looks
 * like it means "all fields optional" and does not: zod still applies a field's
 * `.default()` and still runs its `.transform()` when the key is absent. So
 * `{ isPublished: false }` — what the list screens' publish switches send —
 * parses into an object that ALSO carries `features: []`, `gallery: []`,
 * `popular: false`, `sortOrder: 0` and so on. The update functions write
 * whatever is not `undefined`, so flipping a switch silently erased the
 * record's feature list, gallery and ordering.
 *
 * Filtering the parsed result against the raw body's own keys fixes it for
 * every route at once, and keeps working no matter how the schemas evolve —
 * the alternative, hand-stripping `.default()` off each field and duplicating
 * every schema, has to be got right again every time a field is added.
 *
 * Zod still does its job: values are validated and coerced. This only decides
 * which of them count as "sent".
 */

export function onlySentKeys<T extends object>(rawBody: unknown, parsed: T): Partial<T> {
  // A non-object body never reaches here (the schema would have rejected it),
  // but an empty patch is more honest than guessing.
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return {};
  }

  const sent = new Set(Object.keys(rawBody));

  return Object.fromEntries(
    Object.entries(parsed).filter(([key]) => sent.has(key))
  ) as Partial<T>;
}
