/**
 * FormSlug Component
 *
 * The URL segment a record is published at, derived from another field (the
 * tour's title) unless someone deliberately takes it over.
 *
 * Two things it is careful about:
 *
 *  - Uniqueness is the *server's* answer, not a guess. It asks the same
 *    endpoint the save path uses, so the preview shown here is the URL that
 *    gets stored — including the `-2` suffix when the name is already taken.
 *  - Auto-follow stops the moment the field is edited by hand, and starts off
 *    for a record that already has a slug: renaming a tour must not silently
 *    move a live URL that Google and past customers already hold.
 */

'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { slugify } from '@/lib/slug';
import * as tourService from '@/services/tour.service';

import { FormError } from './FormError';
import { getNestedError } from './form-field-error';

interface FormSlugProps {
  name: string;
  /** Field this slug is derived from while auto-follow is on. */
  sourceName: string;
  label?: string;
  /** Shown before the slug, e.g. "easyridecebutours.com/tours/". */
  prefix?: string;
  /** The record being edited — excluded from the "is it taken?" check. */
  excludeId?: string;
  /** Start following the source field. False when editing a published record. */
  autoFollow?: boolean;
  disabled?: boolean;
  className?: string;
  /** Swappable for a non-tour resource; defaults to the tour endpoint. */
  resolve?: typeof tourService.suggestSlug;
  /** What the record is called in the hints — "tour", "vehicle". */
  noun?: string;
}

/** Long enough that a typist is not firing a request per keystroke. */
const DEBOUNCE_MS = 400;

type Status =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'free' }
  | { kind: 'taken'; suggestion: string };

export const FormSlug: React.FC<FormSlugProps> = ({
  name,
  sourceName,
  label = 'URL slug',
  prefix = '/tours/',
  excludeId,
  autoFollow = true,
  disabled = false,
  className = '',
  resolve = tourService.suggestSlug,
  noun = 'tour',
}) => {
  const {
    control,
    setValue,
    register,
    formState: { errors },
  } = useFormContext();

  const [isAuto, setIsAuto] = useState(autoFollow);
  const [lookupStatus, setLookupStatus] = useState<Status>({ kind: 'idle' });

  // Bumped per lookup so a slow answer can never overwrite a newer one.
  const requestId = useRef(0);
  const reactId = useId();
  const uniqueId = `${name}-${reactId}`;

  const source = useWatch({ control, name: sourceName }) as string | undefined;
  const value = (useWatch({ control, name }) as string | undefined) ?? '';
  const error = getNestedError(errors, name);

  const field = register(name);

  /** What there is to check right now — empty means there is nothing to say. */
  const candidate = isAuto ? slugify(source ?? '') : value.trim();

  // Derived rather than stored: with no candidate the last lookup's answer is
  // about a slug that no longer exists, so it is simply not shown.
  const status: Status = candidate ? lookupStatus : { kind: 'idle' };

  const lookUp = useCallback(
    async (input: { title?: string; slug?: string }) => {
      const ticket = (requestId.current += 1);
      setLookupStatus({ kind: 'checking' });

      try {
        const answer = await resolve({ ...input, excludeId });
        if (ticket !== requestId.current) return null;

        setLookupStatus(
          answer.available ? { kind: 'free' } : { kind: 'taken', suggestion: answer.slug }
        );
        return answer.slug;
      } catch {
        if (ticket === requestId.current) setLookupStatus({ kind: 'idle' });
        return null;
      }
    },
    [excludeId, resolve]
  );

  // Auto-follow: the title drives the slug until someone edits it by hand.
  useEffect(() => {
    if (!isAuto) return;

    if (!candidate) {
      setValue(name, '', { shouldDirty: false });
      return;
    }

    // Show the derived slug immediately; the server only adds a suffix.
    setValue(name, candidate, { shouldDirty: true });

    const timer = setTimeout(async () => {
      const unique = await lookUp({ title: source });
      if (unique) setValue(name, unique, { shouldDirty: true });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [isAuto, candidate, source, name, setValue, lookUp]);

  // Hand-typed: never rewrite what is being typed, just report what will happen.
  useEffect(() => {
    if (isAuto || !candidate) return;

    const timer = setTimeout(() => {
      lookUp({ slug: candidate });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [isAuto, candidate, lookUp]);

  return (
    <div className={`mb-4 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={uniqueId} className="block text-sm font-medium text-slate-700">
          {label}
        </label>

        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsAuto((auto) => !auto)}
          className="text-xs font-medium text-coral hover:text-coral-dark disabled:opacity-40"
        >
          {isAuto ? 'Edit manually' : 'Use the title'}
        </button>
      </div>

      <div
        className={`flex items-center overflow-hidden rounded-lg border bg-white transition-colors focus-within:ring-2 focus-within:ring-coral ${
          error ? 'border-cebu-red' : 'border-slate-200'
        } ${isAuto || disabled ? 'bg-slate-50' : ''}`}
      >
        <span className="shrink-0 border-r border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
          {prefix}
        </span>

        <input
          {...field}
          id={uniqueId}
          type="text"
          // Auto-follow owns the value; typing here would be overwritten by the
          // next keystroke in the title, so the field says so instead.
          readOnly={isAuto}
          disabled={disabled}
          placeholder="auto-generated-from-the-title"
          autoComplete="off"
          onChange={(event) => {
            // Keep it a legal slug as it is typed, so the preview never shows a
            // URL the server would rewrite.
            event.target.value = event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
            field.onChange(event);
          }}
          className={`w-full min-w-0 px-3 py-2.5 text-slate-700 focus:outline-none ${
            isAuto ? 'cursor-default bg-slate-50 text-slate-600' : ''
          }`}
        />

        <span className="flex w-9 shrink-0 items-center justify-center">
          {status.kind === 'checking' && <i className="pi pi-spin pi-spinner text-xs text-slate-400" />}
          {status.kind === 'free' && <i className="pi pi-check text-xs text-emerald-600" />}
          {status.kind === 'taken' && (
            <i className="pi pi-exclamation-circle text-xs text-amber-500" />
          )}
        </span>
      </div>

      {!error && status.kind === 'taken' && (
        <p className="mt-1.5 text-xs text-amber-700">
          {isAuto ? (
            <>Another {noun} already uses that name — this one saves as <strong>{status.suggestion}</strong>.</>
          ) : (
            <>
              That slug is taken. Saving as-is gives you{' '}
              <button
                type="button"
                onClick={() => setValue(name, status.suggestion, { shouldDirty: true })}
                className="font-semibold underline underline-offset-2"
              >
                {status.suggestion}
              </button>
              .
            </>
          )}
        </p>
      )}

      {!error && status.kind !== 'taken' && (
        <p className="mt-1.5 text-xs text-slate-500">
          {isAuto
            ? `Generated from the ${noun} name and kept unique automatically.`
            : 'Lowercase letters, numbers and dashes. Changing this moves the live page.'}
        </p>
      )}

      {error && <FormError error={error} />}
    </div>
  );
};

export default FormSlug;
