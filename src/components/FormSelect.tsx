/**
 * FormSelect Component
 *
 * Reusable select component integrated with react-hook-form using Controller
 * Supports PrimeReact Dropdown with validation
 */

'use client';

import { Dropdown } from 'primereact/dropdown';
import { Controller, useFormContext } from 'react-hook-form';
import { FormError } from './FormError';

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps {
  name: string;
  label?: string;
  placeholder?: string;
  options: SelectOption[];
  readonly?: boolean;
  disabled?: boolean;
  showRequired?: boolean;
  showLabel?: boolean;
  filter?: boolean;
  className?: string;
  inputClassName?: string;
}

export const FormSelect: React.FC<FormSelectProps> = ({
  name,
  label,
  placeholder = 'Select an option',
  options,
  readonly = false,
  disabled = false,
  showRequired = false,
  showLabel = true,
  filter = false,
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
            <Dropdown
              id={uniqueId}
              value={field.value}
              onChange={(e) => field.onChange(e.value)}
              onBlur={field.onBlur}
              options={options}
              optionLabel="label"
              optionValue="value"
              placeholder={placeholder}
              disabled={disabled || readonly}
              filter={filter}
              className={`w-full form-dropdown ${fieldState.invalid ? 'p-invalid' : ''} ${disabled || readonly ? 'p-disabled' : ''} ${inputClassName}`}
              panelClassName="form-dropdown-panel"
            />
            {error && <FormError error={error} />}
          </div>
        )}
      />
    </div>
  );
};

export default FormSelect;
