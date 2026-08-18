/**
 * FormTextarea Component
 *
 * Reusable textarea component integrated with react-hook-form using Controller
 * Supports PrimeReact InputTextarea with validation
 */

'use client';

import { useId } from 'react';
import { InputTextarea } from 'primereact/inputtextarea';
import { Controller, useFormContext } from 'react-hook-form';
import { FormError } from './FormError';

interface FormTextareaProps {
  name: string;
  label?: string;
  placeholder?: string;
  rows?: number;
  readonly?: boolean;
  disabled?: boolean;
  showRequired?: boolean;
  showLabel?: boolean;
  maxLength?: number;
  className?: string;
  inputClassName?: string;
}

export const FormTextarea: React.FC<FormTextareaProps> = ({
  name,
  label,
  placeholder,
  rows = 4,
  readonly = false,
  disabled = false,
  showRequired = false,
  showLabel = true,
  maxLength,
  className = '',
  inputClassName = '',
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
    <div className={`mb-4 ${className}`}>
      {showLabel && label && (
        <label htmlFor={uniqueId} className="block text-sm font-semibold text-slate-900 mb-2">
          {label}
          {showRequired && <span className="text-cebu-red ml-1">*</span>}
        </label>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div className="w-full">
            <InputTextarea
              id={uniqueId}
              rows={rows}
              className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-coral focus:border-coral text-slate-900 bg-white transition-colors resize-none placeholder:text-slate-400
                ${fieldState.invalid ? 'border-cebu-red' : 'border-slate-500'}
                ${disabled || readonly ? 'bg-slate-50 text-slate-600 cursor-not-allowed' : ''}
                ${inputClassName}
              `}
              value={field.value || ''}
              onChange={(e) => field.onChange(e.target.value)}
              onBlur={field.onBlur}
              placeholder={placeholder}
              readOnly={readonly}
              disabled={disabled}
              maxLength={maxLength}
              autoComplete="off"
            />
            {error && <FormError error={error} />}
          </div>
        )}
      />
    </div>
  );
};

export default FormTextarea;
