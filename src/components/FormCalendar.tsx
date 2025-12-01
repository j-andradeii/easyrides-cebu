/**
 * FormCalendar Component
 *
 * Reusable date picker component integrated with react-hook-form using Controller
 * Supports PrimeReact Calendar with validation
 */

'use client';

import { Calendar } from 'primereact/calendar';
import { Controller, useFormContext } from 'react-hook-form';
import { FormError } from './FormError';

interface FormCalendarProps {
  name: string;
  label?: string;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  readonly?: boolean;
  disabled?: boolean;
  showRequired?: boolean;
  showLabel?: boolean;
  showTime?: boolean;
  dateFormat?: string;
  className?: string;
  inputClassName?: string;
}

export const FormCalendar: React.FC<FormCalendarProps> = ({
  name,
  label,
  placeholder = 'Select a date',
  minDate,
  maxDate,
  readonly = false,
  disabled = false,
  showRequired = false,
  showLabel = true,
  showTime = false,
  dateFormat = 'mm/dd/yy',
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
  const uniqueId = `${name}-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`mb-4 ${className}`}>
      {showLabel && label && (
        <label htmlFor={uniqueId} className="block text-sm font-medium text-slate-700 mb-2">
          {label}
          {showRequired && <span className="text-cebu-red ml-1">*</span>}
        </label>
      )}

      <Controller
        name={name}
        control={control}
        render={({ field, fieldState }) => (
          <div className="w-full">
            <Calendar
              id={uniqueId}
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              onBlur={field.onBlur}
              placeholder={placeholder}
              minDate={minDate}
              maxDate={maxDate}
              disabled={disabled || readonly}
              showTime={showTime}
              dateFormat={dateFormat}
              showIcon
              className={`w-full form-calendar ${fieldState.invalid ? 'p-invalid' : ''} ${disabled || readonly ? 'p-disabled' : ''} ${inputClassName}`}
              panelClassName="form-calendar-panel"
            />
            {error && <FormError error={error} />}
          </div>
        )}
      />
    </div>
  );
};

export default FormCalendar;
