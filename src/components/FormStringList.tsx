/**
 * FormStringList Component
 *
 * An ordered list of short lines — what a tour includes, and what it does not.
 * The field's value is a plain `string[]`, exactly what the schema and the
 * public page expect, so nothing has to be mapped on the way in or out.
 *
 * One `Controller` owns the whole array rather than one per row: react-hook-form
 * deliberately does not support field arrays of primitives, and re-rendering a
 * list this short on each keystroke costs nothing.
 */

'use client';

import { useId, useRef } from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { FormError } from './FormError';
import { getNestedError } from './form-field-error';

interface FormStringListProps {
  name: string;
  label?: string;
  hint?: string;
  placeholder?: string;
  /** Text on the button that appends a row. */
  addLabel?: string;
  /** Shown in place of the rows when the list is empty. */
  emptyLabel?: string;
  max?: number;
  disabled?: boolean;
  showRequired?: boolean;
  className?: string;
}

export const FormStringList: React.FC<FormStringListProps> = ({
  name,
  label,
  hint,
  placeholder,
  addLabel = 'Add item',
  emptyLabel = 'Nothing listed yet.',
  max = 60,
  disabled = false,
  showRequired = false,
  className = '',
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  // Lets a freshly added row take the caret without a layout effect: the row
  // that should be focused is remembered here and claimed by its own ref.
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
          const items: string[] = Array.isArray(field.value) ? field.value : [];

          const commit = (next: string[]) => field.onChange(next);

          const setAt = (index: number, value: string) =>
            commit(items.map((item, position) => (position === index ? value : item)));

          const removeAt = (index: number) =>
            commit(items.filter((_, position) => position !== index));

          const add = () => {
            if (items.length >= max) return;
            focusIndex.current = items.length;
            commit([...items, '']);
          };

          const move = (index: number, delta: number) => {
            const target = index + delta;
            if (target < 0 || target >= items.length) return;

            const next = [...items];
            [next[index], next[target]] = [next[target], next[index]];
            commit(next);
          };

          return (
            <div className="w-full">
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-center text-sm text-slate-500">
                  {emptyLabel}
                </p>
              ) : (
                <ul className="space-y-2">
                  {items.map((item, index) => {
                    const rowError = getNestedError(errors, `${name}.${index}`);
                    const rowId = `${name}-${reactId}-${index}`;

                    return (
                      <li key={rowId}>
                        <div className="flex items-center gap-2">
                          <span className="w-5 shrink-0 text-right text-xs font-medium text-slate-400">
                            {index + 1}
                          </span>

                          <input
                            id={rowId}
                            ref={(element) => {
                              if (element && focusIndex.current === index) {
                                focusIndex.current = null;
                                element.focus();
                              }
                            }}
                            type="text"
                            value={item}
                            disabled={disabled}
                            placeholder={placeholder}
                            onChange={(event) => setAt(index, event.target.value)}
                            onBlur={field.onBlur}
                            onKeyDown={(event) => {
                              // Enter would submit the tour form; adding the
                              // next line is what a list is asking for.
                              if (event.key === 'Enter') {
                                event.preventDefault();
                                add();
                              }
                              // Backspace on an empty row deletes it, the way
                              // every bullet list behaves.
                              if (event.key === 'Backspace' && item === '' && items.length > 1) {
                                event.preventDefault();
                                focusIndex.current = Math.max(0, index - 1);
                                removeAt(index);
                              }
                            }}
                            className={`w-full rounded-lg border bg-white px-3 py-2.5 text-slate-700 transition-colors focus:border-transparent focus:ring-2 focus:ring-coral ${
                              rowError ? 'border-cebu-red' : 'border-slate-800'
                            } ${disabled ? 'cursor-not-allowed bg-slate-50 text-slate-500' : ''}`}
                          />

                          <div className="flex shrink-0 items-center">
                            <button
                              type="button"
                              disabled={disabled || index === 0}
                              onClick={() => move(index, -1)}
                              title="Move up"
                              aria-label={`Move item ${index + 1} up`}
                              className="flex h-8 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <i className="pi pi-chevron-up text-xs" />
                            </button>
                            <button
                              type="button"
                              disabled={disabled || index === items.length - 1}
                              onClick={() => move(index, 1)}
                              title="Move down"
                              aria-label={`Move item ${index + 1} down`}
                              className="flex h-8 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
                            >
                              <i className="pi pi-chevron-down text-xs" />
                            </button>
                            <button
                              type="button"
                              disabled={disabled}
                              onClick={() => removeAt(index)}
                              title="Remove"
                              aria-label={`Remove item ${index + 1}`}
                              className="flex h-8 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-red-50 hover:text-cebu-red disabled:opacity-30"
                            >
                              <i className="pi pi-times text-xs" />
                            </button>
                          </div>
                        </div>

                        {rowError && <FormError error={rowError} className="ml-7" />}
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="mt-2 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={disabled || items.length >= max}
                  onClick={add}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:border-coral/60 hover:text-coral disabled:opacity-40"
                >
                  <i className="pi pi-plus text-xs" />
                  {addLabel}
                </button>

                {items.length > 0 && (
                  <span className="text-xs text-slate-500">
                    {items.length} of {max}
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

export default FormStringList;
