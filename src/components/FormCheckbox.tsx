/**
 * FormCheckbox Component
 *
 * Reusable checkbox component integrated with react-hook-form using Controller
 * Supports PrimeReact Checkbox with validation
 */

'use client';

import { useId } from 'react';
import { Checkbox } from 'primereact/checkbox';
import { Controller, useFormContext } from 'react-hook-form';
import { FormError } from './FormError';

interface FormCheckboxProps {
  name: string;
  label?: string;
  description?: string;
  readonly?: boolean;
  disabled?: boolean;
  className?: string;
}

export const FormCheckbox: React.FC<FormCheckboxProps> = ({
  name,
  label,
  description,
  readonly = false,
  disabled = false,
  className = '',
}) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  // Get nested error for this field
  const getNestedError = (errors: Record<string, unknown>, path: string): string | undefined => {
    const parts = path.split('.');
    let current: Record<string, unknown> = errors;

    for (const part of parts) {
      if (!current[part]) return undefined;
      current = current[part] as Record<string, unknown>;
    }

    return current.message as string | undefined;
  };

  const error = getNestedError(errors, name);
  const reactId = useId();
  const uniqueId = `${name}-${reactId}`;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div className={`flex items-start gap-3 ${className}`}>
          <Checkbox
            inputId={uniqueId}
            checked={field.value || false}
            onChange={(e) => field.onChange(e.checked)}
            onBlur={field.onBlur}
            disabled={disabled || readonly}
            className="mt-0.5"
          />
          <div className="flex-1">
            {label && (
              <label
                htmlFor={uniqueId}
                className={`block text-sm font-semibold text-slate-900 cursor-pointer ${
                  disabled || readonly ? 'cursor-not-allowed opacity-60' : ''
                }`}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-sm font-medium text-slate-600 mt-0.5">{description}</p>
            )}
            {error && <FormError error={error} />}
          </div>
        </div>
      )}
    />
  );
};

export default FormCheckbox;
