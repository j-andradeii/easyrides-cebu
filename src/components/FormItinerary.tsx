/**
 * FormItinerary Component
 *
 * The ordered stops of a tour: an optional time and the activity itself.
 * Row order *is* the itinerary, so moving a stop is a first-class action
 * rather than something an editor has to fake by retyping two rows.
 *
 * Same contract as `FormStringList` — one `Controller` owns the array, and the
 * value is the `ItineraryItem[]` the schema and the public page already speak.
 */

'use client';

import { useId, useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import type { ItineraryItem } from '@/types/tour';

import { FormError } from './FormError';
import { getNestedError } from './form-field-error';

interface FormItineraryProps {
  name: string;
  label?: string;
  hint?: string;
  max?: number;
  disabled?: boolean;
  showRequired?: boolean;
  className?: string;
}

const EMPTY_STOP: ItineraryItem = { time: '', activity: '' };

export const FormItinerary: React.FC<FormItineraryProps> = ({
  name,
  label,
  hint,
  max = 80,
  disabled = false,
  showRequired = false,
  className = '',
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const focusIndex = useRef<number | null>(null);
  const reactId = useId();
  const listError = getNestedError(errors, name);

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <span className="mb-2 block text-sm font-medium text-slate-700">
          {label}
          {showRequired && <span className="ml-1 text-cebu-red">*</span>}
        </span>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field }) => {
          const stops: ItineraryItem[] = Array.isArray(field.value) ? field.value : [];

          const commit = (next: ItineraryItem[]) => field.onChange(next);

          const setAt = (index: number, patch: Partial<ItineraryItem>) =>
            commit(stops.map((stop, position) => (position === index ? { ...stop, ...patch } : stop)));

          const removeAt = (index: number) =>
            commit(stops.filter((_, position) => position !== index));

          const add = () => {
            if (stops.length >= max) return;
            focusIndex.current = stops.length;
            commit([...stops, { ...EMPTY_STOP }]);
          };

          const move = (index: number, delta: number) => {
            const target = index + delta;
            if (target < 0 || target >= stops.length) return;

            const next = [...stops];
            [next[index], next[target]] = [next[target], next[index]];
            commit(next);
          };

          return (
            <div className="w-full">
              {stops.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-500">
                  No stops yet — add the pickup first, then work through the day.
                </p>
              ) : (
                <ol className="space-y-2">
                  {stops.map((stop, index) => {
                    const timeError = getNestedError(errors, `${name}.${index}.time`);
                    const activityError = getNestedError(errors, `${name}.${index}.activity`);
                    const rowId = `${name}-${reactId}-${index}`;

                    return (
                      <li key={rowId} className="rounded-lg border border-slate-200 bg-white p-2">
                        <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                            {index + 1}
                          </span>

                          <input
                            id={`${rowId}-time`}
                            type="text"
                            value={stop.time ?? ''}
                            disabled={disabled}
                            placeholder="8:00 AM"
                            aria-label={`Stop ${index + 1} time`}
                            onChange={(event) => setAt(index, { time: event.target.value })}
                            onBlur={field.onBlur}
                            className={`w-24 shrink-0 rounded-lg border bg-white px-2.5 py-2 text-sm text-slate-700 transition-colors focus:border-transparent focus:ring-2 focus:ring-coral ${
                              timeError ? 'border-cebu-red' : 'border-slate-200'
                            } ${disabled ? 'cursor-not-allowed bg-slate-50' : ''}`}
                          />

                          <input
                            id={`${rowId}-activity`}
                            ref={(element) => {
                              if (element && focusIndex.current === index) {
                                focusIndex.current = null;
                                element.focus();
                              }
                            }}
                            type="text"
                            value={stop.activity ?? ''}
                            disabled={disabled}
                            placeholder="Where the group goes, or what happens here"
                            aria-label={`Stop ${index + 1} activity`}
                            onChange={(event) => setAt(index, { activity: event.target.value })}
                            onBlur={field.onBlur}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                add();
                              }
                            }}
                            className={`min-w-0 flex-1 rounded-lg border bg-white px-3 py-2 text-slate-700 transition-colors focus:border-transparent focus:ring-2 focus:ring-coral ${
                              activityError ? 'border-cebu-red' : 'border-slate-200'
                            } ${disabled ? 'cursor-not-allowed bg-slate-50' : ''}`}
                          />

                          <div className="flex shrink-0 items-center">
                            <button
                              type="button"
                              disabled={disabled || index === 0}
                              onClick={() => move(index, -1)}
                              title="Move up"
                              aria-label={`Move stop ${index + 1} up`}
                              className="flex h-8 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <i className="pi pi-chevron-up text-xs" />
                            </button>
                            <button
                              type="button"
                              disabled={disabled || index === stops.length - 1}
                              onClick={() => move(index, 1)}
                              title="Move down"
                              aria-label={`Move stop ${index + 1} down`}
                              className="flex h-8 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <i className="pi pi-chevron-down text-xs" />
                            </button>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => removeAt(index)}
                              title="Remove stop"
                              aria-label={`Remove stop ${index + 1}`}
                              className="flex h-8 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-cebu-red disabled:opacity-30"
                            >
                              <i className="pi pi-times text-xs" />
                            </button>
                          </div>
                        </div>

                        {(timeError || activityError) && (
                          <FormError error={timeError ?? activityError} className="ml-9" />
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}

              <div className="mt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={disabled || stops.length >= max}
                  onClick={add}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-coral/60 hover:text-coral disabled:opacity-40"
                >
                  <i className="pi pi-plus text-xs" />
                  Add stop
                </button>

                {stops.length > 0 && (
                  <span className="text-xs text-slate-500">
                    {stops.length} of {max} stops
                  </span>
                )}
              </div>

              {hint && !listError && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
              {listError && <FormError error={listError} />}
            </div>
          );
        }}
      />
    </div>
  );
};

export default FormItinerary;
