/**
 * FormInput Component
 *
 * Reusable input component integrated with react-hook-form using Controller
 * Supports PrimeReact InputText with validation and formatting options
 */

'use client';

import { useId } from 'react';
import { InputText } from 'primereact/inputtext';
import { Controller, useFormContext } from 'react-hook-form';
import { FormError } from './FormError';

// Input processing utilities
interface InputProcessingOptions {
  enableOnlyInteger?: boolean;
  enablePhoneNumberFormat?: boolean;
  enableAllowNumbersSpacesPlusDash?: boolean;
  enableCreditCardInputFormat?: boolean;
}

/**
 * Validates if the input contains only integers
 */
const validateIntegerOnly = (value: string): boolean => {
  return value === '' || /^[0-9]+$/.test(value);
};

/**
 * Formats a string as a phone number
 */
const formatPhoneNumber = (value: string): string => {
  let input = value.replace(/\D/g, '');

  if (!value.startsWith('+')) {
    input = '+' + input;
  }

  let formattedInput = '';
  if (input.length > 1) {
    formattedInput = `${input.slice(0, 3)}`;
    if (input.length > 3) {
      formattedInput += ` ${input.slice(3, 6)}`;
      if (input.length > 6) {
        formattedInput += ` ${input.slice(6, 10)}`;
        if (input.length > 10) {
          formattedInput += ` ${input.slice(10, 14)}`;
        } else {
          formattedInput += input.slice(10);
        }
      } else {
        formattedInput += input.slice(6);
      }
    } else {
      formattedInput += input.slice(3);
    }
  } else {
    formattedInput = input;
  }

  return formattedInput;
};

/**
 * Formats a string to allow only numbers, spaces, plus signs, and dashes
 */
const formatAllowNumbersSpacesPlusDash = (value: string): string => {
  return value.replace(/[^0-9 \-+]/g, '');
};

/**
 * Formats credit card input with spaces every 4 digits
 */
const formatCreditCardInputFormat = (value: string): string => {
  const formatted = value.replace(/\D/g, '');
  return formatted.replace(/(\d{1,4})/g, '$1 ').trim();
};

/**
 * Process input through validation and formatting pipeline
 */
const processInput = (value: string, options: InputProcessingOptions): string | null => {
  let processedValue = value;

  if (options.enableOnlyInteger && !validateIntegerOnly(value)) {
    return null;
  }

  if (options.enablePhoneNumberFormat) {
    processedValue = formatPhoneNumber(processedValue);
  }

  if (options.enableAllowNumbersSpacesPlusDash) {
    processedValue = formatAllowNumbersSpacesPlusDash(processedValue);
  }

  if (options.enableCreditCardInputFormat) {
    processedValue = formatCreditCardInputFormat(processedValue);
  }

  return processedValue;
};

interface FormInputProps {
  name: string;
  label?: string;
  placeholder?: string;
  type?: string;
  enableOnlyInteger?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  showRequired?: boolean;
  showLabel?: boolean;
  enablePhoneNumberFormat?: boolean;
  enableAllowNumbersSpacesPlusDash?: boolean;
  enableCreditCardInputFormat?: boolean;
  className?: string;
  inputClassName?: string;
}

export const FormInput: React.FC<FormInputProps> = ({
  name,
  label,
  placeholder,
  type = 'text',
  enableOnlyInteger = false,
  readonly = false,
  disabled = false,
  showRequired = false,
  showLabel = true,
  enablePhoneNumberFormat = false,
  enableAllowNumbersSpacesPlusDash = false,
  enableCreditCardInputFormat = false,
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

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    field: { onChange: (value: string) => void; onBlur: () => void }
  ) => {
    const value = e.clipboardData.getData('text/plain');
    const processedValue = processInput(value, {
      enableOnlyInteger,
      enablePhoneNumberFormat,
      enableAllowNumbersSpacesPlusDash,
      enableCreditCardInputFormat,
    });

    if (processedValue !== null) {
      field.onChange(processedValue);
      setTimeout(() => {
        field.onBlur();
      }, 0);
    }

    e.preventDefault();
  };

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
            <InputText
              id={uniqueId}
              type={type}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-coral focus:border-transparent text-slate-700 bg-white transition-colors
                ${fieldState.invalid ? 'border-cebu-red' : 'border-slate-200'}
                ${disabled || readonly ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}
                ${inputClassName}
              `}
              value={field.value || ''}
              onPaste={(e) => handlePaste(e, field)}
              onChange={(e) => {
                const value = e.target.value;
                const processedValue = processInput(value, {
                  enableOnlyInteger,
                  enablePhoneNumberFormat,
                  enableAllowNumbersSpacesPlusDash,
                  enableCreditCardInputFormat,
                });

                if (processedValue !== null) {
                  field.onChange(processedValue);
                }
              }}
              onBlur={field.onBlur}
              placeholder={placeholder}
              readOnly={readonly}
              disabled={disabled}
              autoComplete="off"
            />
            {error && <FormError error={error} />}
          </div>
        )}
      />
    </div>
  );
};

export default FormInput;
